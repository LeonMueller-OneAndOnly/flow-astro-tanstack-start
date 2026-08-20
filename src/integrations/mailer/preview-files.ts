import { readdir, rm } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { Result } from "../../app/lib/framework/result";

/**
 * Verbindlicher Vertrag mit FlowOffice/Omnis: Verzeichnis, Dateinamen und JSON-Aufbau der Mail-Vorschauen.
 * Änderungen hier sind Änderungen an beiden Repositories.
 */
export const mailPreviewsDirectory = "data/mail-preview";

export const mailPreviewFormatVersion = 2;

/** Anzahl der Vorschau-Paare, die im Verzeichnis verbleiben. Bewusst ohne Env-Variable. */
export const mailPreviewsKeep = 100;

/**
 * Die Kopfzeilen stehen in Lesereihenfolge, damit auch die rohe Datei wie ein Mailkopf zu lesen ist.
 * Alle Felder sind immer vorhanden: fehlt der Wert in der Mail, steht dort `null`.
 */
export const ZMailPreviewMetadata = z
  .object({
    formatVersion: z.literal(mailPreviewFormatVersion),
    createdAt: z.iso.datetime(),
    /** `Name <adresse>` oder die nackte Adresse; `null`, wenn kein Absender konfiguriert ist. */
    from: z.string().nullable(),
    /** Mehrere Empfänger werden mit ", " verbunden, ebenso in cc, bcc und replyTo. */
    to: z.string(),
    cc: z.string().nullable(),
    bcc: z.string().nullable(),
    replyTo: z.string().nullable(),
    subject: z.string(),
    reason: z.string(),
    text: z.string().nullable(),
    attachments: z.array(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number().int().nonnegative(),
      }),
    ),
    /** Nur die Metadaten des Termins, nie der iCal-Inhalt. */
    icalEvent: z
      .object({
        filename: z.string(),
        method: z.string(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export type TMailPreviewMetadata = z.infer<typeof ZMailPreviewMetadata>;

/**
 * Stamm beider Dateien eines Vorschau-Paares: `<ISO-Zeitstempel ohne Trennzeichen>-<8 Hex-Zeichen>`.
 * Zeit und Zufall kommen von außen herein, damit die Funktion rein und ohne Mocks testbar bleibt.
 */
export function buildMailPreviewStem(input: { createdAt: Date; randomHex: string }) {
  if (!/^[0-9a-f]{8}$/.test(input.randomHex)) {
    throw new Error(
      `Der Zufallsanteil eines Vorschau-Dateinamens muss aus 8 Hex-Zeichen bestehen: "${input.randomHex}"`,
    );
  }

  const timestamp = input.createdAt
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "");

  return `${timestamp}-${input.randomHex}`;
}

/**
 * Hält die jüngsten `keep` Paare und räumt alles darüber hinaus weg, inklusive verwaister HTML-Dateien
 * und liegen gebliebener `.tmp`-Reste eines abgebrochenen Schreibvorgangs.
 */
export function pruneMailPreviews(input: { directory: string; keep: number }) {
  return Result.fromAsync(async () => {
    if (!Number.isInteger(input.keep) || input.keep < 1) {
      throw new Error(`pruneMailPreviews benötigt eine positive Ganzzahl, erhielt: ${input.keep}`);
    }

    const fileNames = await readdir(input.directory);

    const jsonStems = new Set<string>();
    const htmlStems = new Set<string>();
    const temporaryFileNames: Array<string> = [];

    for (const fileName of fileNames) {
      if (fileName.endsWith(".tmp")) {
        temporaryFileNames.push(fileName);
        continue;
      }
      if (fileName.endsWith(".json")) {
        jsonStems.add(fileName.slice(0, -".json".length));
        continue;
      }
      if (fileName.endsWith(".html")) {
        htmlStems.add(fileName.slice(0, -".html".length));
      }
    }

    // Der Stamm beginnt mit dem Zeitstempel, absteigend sortierte Namen sind daher chronologisch absteigend.
    const obsoleteStems = [...jsonStems].sort().reverse().slice(input.keep);
    const orphanedHtmlStems = [...htmlStems].filter((stem) => !jsonStems.has(stem));

    const obsoleteFileNames = [
      ...obsoleteStems.flatMap((stem) => [`${stem}.json`, `${stem}.html`]),
      ...orphanedHtmlStems.map((stem) => `${stem}.html`),
      ...temporaryFileNames,
    ];

    await Promise.all(
      obsoleteFileNames.map((fileName) =>
        rm(path.join(input.directory, fileName), { force: true }),
      ),
    );

    return { removedFileNames: obsoleteFileNames };
  });
}
