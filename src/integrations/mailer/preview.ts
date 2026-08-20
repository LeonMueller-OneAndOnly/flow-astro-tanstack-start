import { randomBytes } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import previewEmail from "preview-email";

import { Result } from "../../app/lib/framework/result";
import {
  buildMailPreviewStem,
  mailPreviewFormatVersion,
  mailPreviewsDirectory,
  mailPreviewsKeep,
  pruneMailPreviews,
  ZMailPreviewMetadata,
  type TMailPreviewMetadata,
} from "./preview-files";
import { getMailSender } from "./sender";
import type { TMail } from "./types";

/**
 * `files` legt die Vorschau im Workspace ab (Omnis liest sie dort), `browser` öffnet sie lokal,
 * `both` macht beides, `disabled` nichts. Kein Auto-Erkennen und kein Fallback: ein Schreibvorgang
 * im eigenen Repo scheitert praktisch nicht, ein stiller Ersatzpfad würde nur Fehler verdecken.
 */
type TMailPreviewMode = "files" | "browser" | "both" | "disabled";

export async function previewMail(input: { mail: TMail; reason: string }) {
  const mode = parseMailPreviewMode(process.env.MAIL_PREVIEW_MODE);

  if (mode === "disabled") return;

  if (mode === "files") {
    await writeMailPreviewFilesOrThrow(input);
    return;
  }

  if (mode === "browser") {
    await previewEmail(input.mail);
    return;
  }

  if (mode === "both") {
    await writeMailPreviewFilesOrThrow(input);
    await previewEmail(input.mail);
    return;
  }

  const never: never = mode;
  throw new Error(`Unbehandelter MAIL_PREVIEW_MODE: ${String(never)}`);
}

/**
 * Schreibt das Vorschau-Paar nach `<cwd>/data/mail-preview`: erst die `.html`, dann die `.json`
 * atomar über `<stem>.json.tmp` + `rename`. Omnis führt seine Liste ausschließlich über die `.json`;
 * ein abgebrochener Schreibvorgang hinterlässt damit höchstens ein verwaistes HTML, nie einen
 * Listeneintrag ohne Inhalt.
 */
export async function writeMailPreviewFiles(input: { mail: TMail; reason: string }) {
  const directory = path.join(process.cwd(), mailPreviewsDirectory);
  const createdAt = new Date();
  const stem = buildMailPreviewStem({
    createdAt,
    randomHex: randomBytes(4).toString("hex"),
  });

  const htmlPath = path.join(directory, `${stem}.html`);
  const jsonPath = path.join(directory, `${stem}.json`);
  const temporaryJsonPath = `${jsonPath}.tmp`;

  const sender = getMailSender();

  // Reihenfolge der Felder wie im Vertrag: die Kopfzeilen in Lesereihenfolge.
  const metadata: TMailPreviewMetadata = {
    formatVersion: mailPreviewFormatVersion,
    createdAt: createdAt.toISOString(),
    from:
      sender === null
        ? null
        : sender.name === null
          ? sender.address
          : `${sender.name} <${sender.address}>`,
    to: joinMailAddresses(input.mail.to),
    cc: input.mail.cc === undefined ? null : joinMailAddresses(input.mail.cc),
    bcc: input.mail.bcc === undefined ? null : joinMailAddresses(input.mail.bcc),
    replyTo: input.mail.replyTo === undefined ? null : joinMailAddresses(input.mail.replyTo),
    subject: input.mail.subject ?? "(kein Betreff)",
    reason: input.reason,
    text: input.mail.text ?? null,
    attachments: (input.mail.attachments ?? []).map((attachment) => ({
      filename: attachment.filename ?? "attachment",
      contentType: attachment.contentType ?? "application/octet-stream",
      size: attachment.content.length,
    })),
    // Bewusst ohne `content`: die Vorschau trägt Kopfzeilen, nicht den Termin selbst.
    icalEvent:
      input.mail.icalEvent === undefined
        ? null
        : { filename: input.mail.icalEvent.filename, method: input.mail.icalEvent.method },
  };

  const written = await Result.fromAsync(async () => {
    const validated = ZMailPreviewMetadata.parse(metadata);

    await mkdir(directory, { recursive: true });
    await writeFile(htmlPath, buildPreviewDocument(input.mail), "utf8");
    await writeFile(temporaryJsonPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
    await rename(temporaryJsonPath, jsonPath);
  });

  if (!written.success) return written;

  console.info(`Mail-Vorschau geschrieben: ${htmlPath}`);

  const pruned = await pruneMailPreviews({ directory, keep: mailPreviewsKeep });
  if (!pruned.success) {
    // Aufräumen ist Nebensache: der Schreibvorgang war erfolgreich und bleibt es auch.
    console.warn("Mail-Vorschauen konnten nicht aufgeräumt werden", pruned.error);
  }

  return Result.ok({ htmlPath, jsonPath, stem });
}

async function writeMailPreviewFilesOrThrow(input: { mail: TMail; reason: string }) {
  const written = await writeMailPreviewFiles(input);

  // Der Aufrufer ist ein Job mit Wiederholungen. Eine still verschluckte Vorschau wäre eine
  // spurlos verschwundene Mail, deshalb schlägt der Job hier bewusst fehl.
  if (!written.success) {
    throw new Error(`Mail-Vorschau konnte nicht geschrieben werden: ${written.error.message}`, {
      cause: written.error,
    });
  }
}

/**
 * Der Mailkörper, falls vorhanden. Sonst der Textkörper in einem minimalen Dokument.
 * Bewusst nicht `preview-email`: dessen Kopfzeilen-Tabelle ist überflüssig, weil der Omnis-Viewer
 * Empfänger, Grund und Zeitpunkt selbst aus der `.json` darstellt.
 */
function buildPreviewDocument(mail: TMail) {
  if (mail.html) return mail.html;

  const escapedText = (mail.text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <pre style="white-space: pre-wrap; font-family: ui-monospace, monospace">${escapedText}</pre>
  </body>
</html>
`;
}

/** `to`, `cc`, `bcc` und `replyTo` werden gleich dargestellt: mehrere Adressen mit ", " verbunden. */
function joinMailAddresses(addresses: string | Array<string>) {
  return Array.isArray(addresses) ? addresses.join(", ") : addresses;
}

function parseMailPreviewMode(value: string | undefined): TMailPreviewMode {
  if (value === undefined || value === "") return "files";

  if (value === "browser" || value === "both" || value === "disabled" || value === "files") {
    return value;
  }

  // Ein Tippfehler in der Konfiguration darf nicht stillschweigend zu einem anderen Verhalten führen.
  throw new Error(
    `Unbekannter MAIL_PREVIEW_MODE: "${value}". Erlaubt sind: files, browser, both, disabled.`,
  );
}
