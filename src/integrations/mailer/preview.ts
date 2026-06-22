import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import previewEmail from "preview-email";

import { Result } from "../../app/lib/result";
import type { TMail } from "./types";

type MailPreviewMode = "auto" | "omnis" | "browser" | "disabled";

type OmnisMailPreviewPayload = {
  to: string;
  subject: string;
  reason: string;
  html: string;
  text?: string;
  attachments: Array<{
    filename: string;
    contentType?: string;
    size?: number;
  }>;
  source: "preview-email";
};

export async function previewMail(input: { mail: TMail; reason: string }) {
  const mode = parseMailPreviewMode(process.env.MAIL_PREVIEW_MODE);

  if (mode === "disabled") return;
  if (mode === "browser") {
    await previewEmail(input.mail);
    return;
  }

  const omnisPreview = await Result.fromAsync(async () => {
    const previewUrl = await previewEmail(input.mail, { open: false });
    const html = await readPreviewHtml(previewUrl);
    await submitPreviewToOmnis({ mail: input.mail, reason: input.reason, html });
  });

  if (omnisPreview.success) return;

  if (mode === "omnis") {
    throw new Error(`Omnis mail preview failed: ${omnisPreview.error.message}`);
  }

  console.warn("Omnis mail preview failed. Falling back to browser preview.", omnisPreview.error);
  await previewEmail(input.mail);
}

function parseMailPreviewMode(value: string | undefined): MailPreviewMode {
  if (value === "omnis" || value === "browser" || value === "disabled") return value;
  return "auto";
}

async function readPreviewHtml(previewUrl: string) {
  if (!previewUrl.startsWith("file://")) {
    throw new Error(`Unsupported preview URL: ${previewUrl}`);
  }
  return readFile(fileURLToPath(previewUrl), "utf8");
}

async function submitPreviewToOmnis(input: { mail: TMail; reason: string; html: string }) {
  const payload: OmnisMailPreviewPayload = {
    to: formatAddress(input.mail.to),
    subject: input.mail.subject ?? "(no subject)",
    reason: input.reason,
    html: input.html,
    text: input.mail.text,
    attachments: (input.mail.attachments ?? []).map((attachment) => ({
      filename: attachment.filename ?? "attachment",
      contentType: attachment.contentType,
      size: attachment.content.length,
    })),
    source: "preview-email",
  };

  const result = await spawnWithStdin({
    command: "omnisd",
    args: ["mail-preview", "submit", "--json-stdin"],
    stdin: JSON.stringify(payload),
  });

  if (!result.success) throw result.error;
  if (result.data.exitCode !== 0) {
    throw new Error(result.data.stderr || `omnisd exited with code ${result.data.exitCode}`);
  }
}

function formatAddress(value: TMail["to"]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function spawnWithStdin(input: { command: string; args: string[]; stdin: string }) {
  return Result.fromAsync(
    () =>
      new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve, reject) => {
        const child = spawn(input.command, input.args, { stdio: ["pipe", "pipe", "pipe"] });
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
        child.on("error", reject);
        child.on("close", (code) => {
          resolve({
            exitCode: code ?? 1,
            stdout: Buffer.concat(stdoutChunks).toString("utf8").trim(),
            stderr: Buffer.concat(stderrChunks).toString("utf8").trim(),
          });
        });

        child.stdin.end(input.stdin);
      }),
  );
}
