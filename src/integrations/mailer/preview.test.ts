import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import previewEmail from "preview-email";

import { ZMailPreviewMetadata } from "./preview-files";
import { previewMail, writeMailPreviewFiles } from "./preview";

// Der einzige erlaubte Mock: `previewEmail` würde in den Modus-Tests einen echten Browser öffnen.
vi.mock("preview-email", () => ({
  default: vi.fn<() => Promise<string>>(async () => "file:///dev/null"),
}));

const originalWorkingDirectory = process.cwd();
const originalPreviewMode = process.env.MAIL_PREVIEW_MODE;

let workspace = "";

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), "omnis-mail-preview-workspace-"));
  process.chdir(workspace);
  vi.mocked(previewEmail).mockClear();
});

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  rmSync(workspace, { force: true, recursive: true });

  if (originalPreviewMode === undefined) {
    Reflect.deleteProperty(process.env, "MAIL_PREVIEW_MODE");
  } else {
    process.env.MAIL_PREVIEW_MODE = originalPreviewMode;
  }
});

function readPreviewDirectory() {
  const directory = join(workspace, "data", "mail-preview");
  if (!existsSync(directory)) return { directory, fileNames: [] as Array<string> };

  return { directory, fileNames: readdirSync(directory).sort() };
}

describe("writeMailPreviewFiles", () => {
  test("legt ein Paar aus .html und .json an und verbindet mehrere Empfänger", async () => {
    const written = await writeMailPreviewFiles({
      mail: {
        to: ["empfaenger@example.com", "zweiter@example.com"],
        subject: "Passwort zurücksetzen",
        html: "<p>Hallo Welt</p>",
      },
      reason: "password-reset",
    });

    expect(written.success).toBe(true);

    const { directory, fileNames } = readPreviewDirectory();
    expect(fileNames).toHaveLength(2);

    const jsonFileName = fileNames.find((fileName) => fileName.endsWith(".json")) ?? "";
    const stem = jsonFileName.slice(0, -".json".length);
    expect(fileNames).toEqual([`${stem}.html`, `${stem}.json`]);
    expect(stem).toMatch(/^\d{8}T\d{9}Z-[0-9a-f]{8}$/);

    const metadata = ZMailPreviewMetadata.parse(
      JSON.parse(readFileSync(join(directory, jsonFileName), "utf8")),
    );
    expect(metadata).toEqual({
      formatVersion: 1,
      createdAt: metadata.createdAt,
      to: "empfaenger@example.com, zweiter@example.com",
      subject: "Passwort zurücksetzen",
      reason: "password-reset",
      text: null,
      attachments: [],
    });

    expect(readFileSync(join(directory, `${stem}.html`), "utf8")).toBe("<p>Hallo Welt</p>");
  });

  test("hüllt eine Text-Mail in ein minimales Dokument und escapet den Inhalt", async () => {
    await writeMailPreviewFiles({
      mail: { to: "empfaenger@example.com", subject: "Nur Text", text: "5 < 6 & <b>fett</b>" },
      reason: "plain-text",
    });

    const { directory, fileNames } = readPreviewDirectory();
    const stem = (fileNames.find((fileName) => fileName.endsWith(".json")) ?? "").slice(
      0,
      -".json".length,
    );

    const html = readFileSync(join(directory, `${stem}.html`), "utf8");
    expect(html).toContain("5 &lt; 6 &amp; &lt;b&gt;fett&lt;/b&gt;");
    expect(html).not.toContain("<b>fett</b>");

    const metadata = ZMailPreviewMetadata.parse(
      JSON.parse(readFileSync(join(directory, `${stem}.json`), "utf8")),
    );
    expect(metadata.text).toBe("5 < 6 & <b>fett</b>");
  });

  test("setzt den Ersatzbetreff, wenn die Mail keinen hat", async () => {
    await writeMailPreviewFiles({
      mail: { to: "empfaenger@example.com", html: "<p>ohne Betreff</p>" },
      reason: "no-subject",
    });

    const { directory, fileNames } = readPreviewDirectory();
    const jsonFileName = fileNames.find((fileName) => fileName.endsWith(".json")) ?? "";
    const metadata = ZMailPreviewMetadata.parse(
      JSON.parse(readFileSync(join(directory, jsonFileName), "utf8")),
    );

    expect(metadata.subject).toBe("(kein Betreff)");
  });

  test("schreibt Anhänge als reine Metadaten ohne zusätzliche Dateien", async () => {
    await writeMailPreviewFiles({
      mail: {
        to: "empfaenger@example.com",
        subject: "Mit Anhang",
        html: "<p>Rechnung</p>",
        attachments: [
          { filename: "rechnung.pdf", content: "12345", contentType: "application/pdf" },
          { content: "xx" },
        ],
      },
      reason: "invoice",
    });

    const { directory, fileNames } = readPreviewDirectory();
    expect(fileNames).toHaveLength(2);

    const jsonFileName = fileNames.find((fileName) => fileName.endsWith(".json")) ?? "";
    const metadata = ZMailPreviewMetadata.parse(
      JSON.parse(readFileSync(join(directory, jsonFileName), "utf8")),
    );

    expect(metadata.attachments).toEqual([
      { filename: "rechnung.pdf", contentType: "application/pdf", size: 5 },
      { filename: "attachment", contentType: "application/octet-stream", size: 2 },
    ]);
  });

  test("räumt nach dem Schreiben auf 100 Paare zurück", async () => {
    for (let index = 0; index < 101; index += 1) {
      await writeMailPreviewFiles({
        mail: { to: "empfaenger@example.com", subject: `Mail ${index}`, html: "<p>x</p>" },
        reason: "flood",
      });
    }

    expect(readPreviewDirectory().fileNames).toHaveLength(200);
  });
});

describe("previewMail", () => {
  test("schreibt im Modus files nur Dateien", async () => {
    process.env.MAIL_PREVIEW_MODE = "files";

    await previewMail({
      mail: { to: "empfaenger@example.com", subject: "Modus files", html: "<p>x</p>" },
      reason: "mode-test",
    });

    expect(readPreviewDirectory().fileNames).toHaveLength(2);
    expect(vi.mocked(previewEmail)).not.toHaveBeenCalled();
  });

  test("schreibt ohne gesetzte Variable ebenfalls Dateien", async () => {
    Reflect.deleteProperty(process.env, "MAIL_PREVIEW_MODE");

    await previewMail({
      mail: { to: "empfaenger@example.com", subject: "Vorgabe", html: "<p>x</p>" },
      reason: "mode-test",
    });

    expect(readPreviewDirectory().fileNames).toHaveLength(2);
    expect(vi.mocked(previewEmail)).not.toHaveBeenCalled();
  });

  test("öffnet im Modus browser nur den Browser", async () => {
    process.env.MAIL_PREVIEW_MODE = "browser";

    await previewMail({
      mail: { to: "empfaenger@example.com", subject: "Modus browser", html: "<p>x</p>" },
      reason: "mode-test",
    });

    expect(readPreviewDirectory().fileNames).toEqual([]);
    expect(vi.mocked(previewEmail)).toHaveBeenCalledTimes(1);
  });

  test("macht im Modus both beides", async () => {
    process.env.MAIL_PREVIEW_MODE = "both";

    await previewMail({
      mail: { to: "empfaenger@example.com", subject: "Modus both", html: "<p>x</p>" },
      reason: "mode-test",
    });

    expect(readPreviewDirectory().fileNames).toHaveLength(2);
    expect(vi.mocked(previewEmail)).toHaveBeenCalledTimes(1);
  });

  test("tut im Modus disabled nichts", async () => {
    process.env.MAIL_PREVIEW_MODE = "disabled";

    await previewMail({
      mail: { to: "empfaenger@example.com", subject: "Modus disabled", html: "<p>x</p>" },
      reason: "mode-test",
    });

    expect(readPreviewDirectory().fileNames).toEqual([]);
    expect(vi.mocked(previewEmail)).not.toHaveBeenCalled();
  });

  test("weist einen unbekannten Modus zurück, statt still etwas anderes zu tun", async () => {
    // Über Reflect gesetzt: der abgelegte Modus "omnis" ist im Typ der Env-Variablen nicht mehr enthalten,
    // kann eine reale Umgebung aber weiterhin liefern.
    Reflect.set(process.env, "MAIL_PREVIEW_MODE", "omnis");

    await expect(
      previewMail({
        mail: { to: "empfaenger@example.com", subject: "Tippfehler", html: "<p>x</p>" },
        reason: "mode-test",
      }),
    ).rejects.toThrow(/MAIL_PREVIEW_MODE/);
  });
});
