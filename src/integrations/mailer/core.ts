import { createRequire } from "node:module";

import { z } from "zod";

import { Result } from "../../app/lib/result";

const require = createRequire(import.meta.url);

const nodemailer = require("nodemailer") as {
  createTransport(config: unknown): NodeMailerTransporter;
};
const htmlToText = require("nodemailer-html-to-text").htmlToText as () => unknown;
export const previewEmail_inBrowser = require("preview-email") as (
  message: TMail,
) => Promise<string>;

type NodeMailerTransporter = {
  sendMail(mail: unknown, callback: (err: Error | null, info: unknown) => void): void;
  use(step: string, plugin: unknown): void;
  verify(callback: (error: Error | null, success: boolean) => void): void;
};

const ZMailAttachment = z
  .object({
    filename: z.string().optional(),
    content: z.any(),
    contentType: z.string().optional(),
    encoding: z.string().optional(),
  })
  .passthrough();

const ZMailAddress = z.union([
  z.string(),
  z.array(z.string()),
  z.object({ name: z.string().optional(), address: z.string() }).passthrough(),
  z.array(z.object({ name: z.string().optional(), address: z.string() }).passthrough()),
]);

export const ZMail = z
  .object({
    to: ZMailAddress,
    subject: z.string().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: ZMailAddress.optional(),
    bcc: ZMailAddress.optional(),
    replyTo: ZMailAddress.optional(),
    attachments: z.array(ZMailAttachment).optional(),
    icalEvent: z
      .object({
        filename: z.string(),
        content: z.any(),
        method: z.string(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type TMail = z.infer<typeof ZMail>;

export const ZMailOutgoingMailer = z.object({ type: z.literal("internal") });

export type TMailOutgoingMailer = z.infer<typeof ZMailOutgoingMailer>;

export const isTestEnv = [process.env.APP_ENV, process.env.NODE_ENV].includes("test");

export async function handleJob_sendMail(
  mail: TMail,
  reason: string,
  outgoingMailer: TMailOutgoingMailer = { type: "internal" },
) {
  const strategy = (() => {
    if (process.env.APP_ENV === "production") {
      return "send-via-smtp";
    }

    if (isTestEnv) {
      return "ignore";
    }

    return "preview-in-browser";
  })();

  if (strategy === "send-via-smtp") {
    await sendMailViaOutgoingMailer(mail, reason, outgoingMailer);
  }

  if (strategy === "preview-in-browser") {
    await previewEmail_inBrowser(mail);
  }
}

export async function sendMailViaOutgoingMailer(
  mail: TMail,
  reason: string,
  outgoingMailer: TMailOutgoingMailer,
) {
  if (outgoingMailer.type === "internal") {
    await sendMailViaSmtp(mail, reason);
    return;
  }

  throw new Error(`Unsupported outgoing mailer: ${outgoingMailer.type}`);
}

/**
 * @deprecated Use sendMail so mails run through the job queue instead of API request lifecycles.
 */
export async function sendMailViaSmtp(mail: TMail, reason: string) {
  const transporter = getDefaultMailTransporter();
  const result = await Result.fromAsync(
    () =>
      new Promise<unknown>((resolve, reject) => {
        transporter.sendMail(
          {
            ...mail,

            from: {
              name: "FlowOffice",
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
  const returnArr: z.infer<typeof ZMailAttachment>[] = [];

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
