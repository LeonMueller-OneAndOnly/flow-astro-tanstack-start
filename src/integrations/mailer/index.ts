import { sendMailJob } from "src/jobs/send-mail";
import nodemailer from "nodemailer";

import { htmlToText } from "nodemailer-html-to-text";

import { ZMail, type TMail } from "./types";
import { previewMail } from "./preview";

import { Result } from "../../app/lib/result";
import { z } from "zod";

export const ZMailOutgoingMailer = z.object({ type: z.literal("internal") });

export type TMailOutgoingMailer = z.infer<typeof ZMailOutgoingMailer>;

export const ZMailTransport = z.enum(["send-via-smtp", "preview-in-browser", "ignore"]);

export type TMailTransport = z.infer<typeof ZMailTransport>;

export const isTestEnv = [process.env.APP_ENV, process.env.NODE_ENV].includes("test");

export async function sendMail(input: {
  mail: TMail;
  /** specify mailer type via free form string */
  reason: string;
}) {
  const mail = ZMail.parse(input.mail);

  const transport = getMailTransport();

  if (
    process.env["send-out-mail-without-job-queue-usage_DEV_ONLY"] &&
    process.env.APP_ENV !== "production"
  ) {
    return handleJob_sendMail({ mail, reason: input.reason, transport });
  }

  if (isTestEnv) return;

  await sendMailJob.enqueue({ mail, reason: input.reason, transport }, { maxAttempts: 3 });
}

export async function handleJob_sendMail(input: {
  mail: TMail;
  reason: string;
  transport: TMailTransport;
}) {
  if (input.transport === "send-via-smtp") {
    await sendMailViaSmtp(input.mail, input.reason);
  }

  if (input.transport === "preview-in-browser") {
    await previewMail({ mail: input.mail, reason: input.reason });
  }
}

function getMailTransport(): TMailTransport {
  if (process.env["open-preview-for-all-mails_DEV_ONLY"] && process.env.APP_ENV !== "production") {
    return "preview-in-browser";
  }

  if (
    process.env["send-out-mail-without-job-queue-usage_DEV_ONLY"] &&
    process.env.APP_ENV !== "production"
  ) {
    return "send-via-smtp";
  }

  if (process.env.APP_ENV === "production") return "send-via-smtp";

  if (isTestEnv) return "ignore";

  return "preview-in-browser";
}

async function sendMailViaSmtp(mail: TMail, reason: string) {
  const transporter = getDefaultMailTransporter();
  const result = await Result.fromAsync(
    () =>
      new Promise<unknown>((resolve, reject) => {
        transporter.sendMail(
          {
            ...mail,

            from: {
              name: process.env.SMTP_FROM_NAME,
              address: process.env.SMTP_USERNAME, // listed in rfc822 message header
            },
            /**
             * Difference between "envelope from" and "header from":
             * https://www.xeams.com/difference-envelope-header.htm
             */
            envelope: {
              from: process.env.SMTP_USERNAME, // used as MAIL FROM: address for SMTP
              to: mail.to, // used as RCPT TO: address for SMTP
              // bcc: theMail.bcc,
              // cc: theMail.cc,
            },

            /**
             * Das Feld icalEvent in Nodemailer erzeugt automatisch einen Anhang und fügt die iCal-Daten
             * auch als "alternativen" MIME-Part hinzu.
             * Viele E-Mail-Clients interpretieren das unterschiedlich, oftmals wird dieses Event dann dopplet angezeigt.
             * => um das zu vermeiden, stellen wir sicher, dass dies einfach als regulärer Anhang versendet wird.
             */
            icalEvent: undefined,
            attachments: buildMailAttachments(mail),
          },
          (err, info) => {
            if (err) reject(err);
            else resolve(info);
          },
        );
      }),
  );

  if (!result.success) {
    console.error(`Failed to sent eMail to: ${mail.to} - reason: ${reason}`, result.error);
    throw result.error;
  }

  console.log(`Successfully sent eMail to: ${mail.to} - reason: ${reason}`);
}

function buildMailAttachments(mail: TMail) {
  const returnArr: TMail["attachments"] = [];

  if (mail.icalEvent) {
    returnArr.push({
      filename: mail.icalEvent.filename,
      content: mail.icalEvent.content,
      contentType: `text/calendar; method=${mail.icalEvent.method}`,
    });
  }

  for (const attachment of mail.attachments ?? []) {
    returnArr.push({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
      encoding: attachment.encoding,
    });
  }

  return returnArr.length > 0 ? returnArr : undefined;
}

type NodeMailerTransporter = {
  sendMail(mail: unknown, callback: (err: Error | null, info: unknown) => void): void;
  use(step: string, plugin: unknown): void;
  verify(callback: (error: Error | null, success: boolean) => void): void;
};

let defaultMailTransporter: NodeMailerTransporter | undefined;

function getDefaultMailTransporter() {
  defaultMailTransporter ??= createNodeMailerTransporter();
  return defaultMailTransporter;
}

function createNodeMailerTransporter(): NodeMailerTransporter {
  const key_globalThis = "__nodemailer_transport-instance__";
  const globalWithTransporter = globalThis as typeof globalThis & {
    [key_globalThis]?: NodeMailerTransporter;
  };

  if (globalWithTransporter[key_globalThis]) return globalWithTransporter[key_globalThis];

  const transporter = nodemailer.createTransport({
    secure: true,
    port: 465,
    host: process.env.SMTP_HOST,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  /* plugins / middleware */
  transporter.use("compile", htmlToText());

  /* verify connection configuration */
  transporter.verify(function (error: Error | null, success: boolean) {
    if (error && process.env.APP_ENV === "production") {
      console.error("Failed to verify SMTP connection", error);
    }

    if (success) {
      console.log(`SMTP connection to "${process.env.SMTP_USERNAME}" was verified`);
    }
  });

  globalWithTransporter[key_globalThis] = transporter;

  return transporter;
}
