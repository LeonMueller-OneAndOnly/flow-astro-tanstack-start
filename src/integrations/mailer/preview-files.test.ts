import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  buildMailPreviewStem,
  mailPreviewFormatVersion,
  mailPreviewsDirectory,
  mailPreviewsKeep,
  pruneMailPreviews,
  ZMailPreviewMetadata,
} from "./preview-files";

/** Das Beispiel aus Abschnitt 3 des Plans, wörtlich. */
const exampleMetadata = {
  formatVersion: 1,
  createdAt: "2026-08-20T14:12:33.123Z",
  to: "empfaenger@example.com, zweiter@example.com",
  subject: "Passwort zurücksetzen",
  reason: "password-reset",
  text: null,
  attachments: [{ filename: "rechnung.pdf", contentType: "application/pdf", size: 51234 }],
};

describe("Format-Konstanten", () => {
  test("liegen auf den vereinbarten Werten", () => {
    expect(mailPreviewsDirectory).toBe("data/mail-preview");
    expect(mailPreviewFormatVersion).toBe(1);
    expect(mailPreviewsKeep).toBe(100);
  });
});

describe("buildMailPreviewStem", () => {
  test("baut den Stamm ohne Trennzeichen aus Zeitstempel und Zufall", () => {
    expect(
      buildMailPreviewStem({
        createdAt: new Date("2026-08-20T14:12:33.123Z"),
        randomHex: "a1b2c3d4",
      }),
    ).toBe("20260820T141233123Z-a1b2c3d4");
  });

  test("erzeugt lexikografisch chronologische Namen", () => {
    const earlier = buildMailPreviewStem({
      createdAt: new Date("2026-08-20T14:12:33.123Z"),
      randomHex: "ffffffff",
    });
    const later = buildMailPreviewStem({
      createdAt: new Date("2026-08-20T14:12:33.124Z"),
      randomHex: "00000000",
    });

    expect(earlier < later).toBe(true);
  });

  test("weist einen Zufallsanteil zurück, der nicht aus 8 Hex-Zeichen besteht", () => {
    expect(() =>
      buildMailPreviewStem({ createdAt: new Date("2026-08-20T14:12:33.123Z"), randomHex: "xyz" }),
    ).toThrow(/8 Hex-Zeichen/);
  });
});

describe("ZMailPreviewMetadata", () => {
  test("akzeptiert das Beispiel aus dem Vertrag", () => {
    expect(ZMailPreviewMetadata.parse(exampleMetadata)).toEqual(exampleMetadata);
  });

  test("akzeptiert einen gesetzten Textkörper und leere Anhänge", () => {
    expect(
      ZMailPreviewMetadata.safeParse({ ...exampleMetadata, text: "Hallo", attachments: [] })
        .success,
    ).toBe(true);
  });

  test("lehnt fehlendes formatVersion ab", () => {
    const { formatVersion: _formatVersion, ...withoutFormatVersion } = exampleMetadata;

    expect(ZMailPreviewMetadata.safeParse(withoutFormatVersion).success).toBe(false);
  });

  test("lehnt eine fremde Formatversion ab", () => {
    expect(ZMailPreviewMetadata.safeParse({ ...exampleMetadata, formatVersion: 2 }).success).toBe(
      false,
    );
  });

  test("lehnt fehlendes attachments ab", () => {
    const { attachments: _attachments, ...withoutAttachments } = exampleMetadata;

    expect(ZMailPreviewMetadata.safeParse(withoutAttachments).success).toBe(false);
  });

  test("lehnt ein zusätzliches Feld ab", () => {
    expect(
      ZMailPreviewMetadata.safeParse({ ...exampleMetadata, html: "<p>nein</p>" }).success,
    ).toBe(false);
  });

  test("lehnt fehlendes text ab, weil es nullable und nicht optional ist", () => {
    const { text: _text, ...withoutText } = exampleMetadata;

    expect(ZMailPreviewMetadata.safeParse(withoutText).success).toBe(false);
  });

  test("lehnt einen Zeitstempel ohne ISO-Form ab", () => {
    expect(
      ZMailPreviewMetadata.safeParse({ ...exampleMetadata, createdAt: "gestern" }).success,
    ).toBe(false);
  });
});

describe("pruneMailPreviews", () => {
  test("behält aus 105 Paaren die 100 jüngsten", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mail-preview-"));
    const stems = Array.from({ length: 105 }, (_unused, index) =>
      buildMailPreviewStem({
        createdAt: new Date(Date.UTC(2026, 7, 20, 14, 12, 33, index)),
        randomHex: "a1b2c3d4",
      }),
    );

    for (const stem of stems) {
      writeFileSync(join(directory, `${stem}.html`), "<p>x</p>");
      writeFileSync(join(directory, `${stem}.json`), "{}");
    }

    const pruned = await pruneMailPreviews({ directory, keep: 100 });
    expect(pruned.success).toBe(true);

    const remaining = readdirSync(directory);
    const remainingStems = remaining
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => fileName.slice(0, -".json".length))
      .sort();

    expect(remaining).toHaveLength(200);
    expect(remainingStems).toEqual(stems.slice(5).sort());

    rmSync(directory, { force: true, recursive: true });
  });

  test("entfernt verwaistes HTML und .tmp-Reste, behält vollständige Paare", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mail-preview-"));
    const stem = buildMailPreviewStem({
      createdAt: new Date("2026-08-20T14:12:33.123Z"),
      randomHex: "a1b2c3d4",
    });
    const orphanedStem = buildMailPreviewStem({
      createdAt: new Date("2026-08-20T14:12:34.000Z"),
      randomHex: "b2c3d4e5",
    });

    writeFileSync(join(directory, `${stem}.html`), "<p>x</p>");
    writeFileSync(join(directory, `${stem}.json`), "{}");
    writeFileSync(join(directory, `${orphanedStem}.html`), "<p>verwaist</p>");
    writeFileSync(join(directory, `${orphanedStem}.json.tmp`), "{}");

    const pruned = await pruneMailPreviews({ directory, keep: 100 });
    expect(pruned.success).toBe(true);

    expect(readdirSync(directory).sort()).toEqual([`${stem}.html`, `${stem}.json`]);

    rmSync(directory, { force: true, recursive: true });
  });

  test("meldet ein fehlendes Verzeichnis als Fehler statt zu werfen", async () => {
    const pruned = await pruneMailPreviews({
      directory: join(tmpdir(), "mail-preview-gibt-es-nicht"),
      keep: 100,
    });

    expect(pruned.success).toBe(false);
  });
});
