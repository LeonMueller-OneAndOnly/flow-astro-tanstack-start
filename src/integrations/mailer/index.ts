import * as nodemailer from "nodemailer";
const htmlToText = require("nodemailer-html-to-text").htmlToText;

import { getJobQueue } from "integrations/postgres-job-queue/getJobQueue";
import { QueueNames } from "integrations/postgres-job-queue/queueNames";

import previewEmail_inBrowser from "preview-email";

import { Result } from "@sapphire/result";

import {
  TMailOutgoingMailer,
  ZJobData_Mail,
} from "integrations/postgres-job-queue/row-schema/mail";
import { ZMail, TMail } from "app/core/types";
import db from "db";
import { decryptOutgoingMailerSecret } from "app/core/lib/outgoingMailerSecret";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Attachment } from "nodemailer/lib/mailer";
import { Job } from "pg-boss";
import { z } from "zod";

const isTestEnv = [process.env.APP_ENV, process.env.NODE_ENV].includes("test");

export async function sendMail(
  theMail: TMail,
  reason: string,
  options?: { outgoingMailer?: TMailOutgoingMailer },
) {
  const outgoingMailer: TMailOutgoingMailer = options?.outgoingMailer ?? { type: "internal" };

  if (process.env["open-preview-for-all-mails_DEV_ONLY"] && process.env.APP_ENV !== "production") {
    return previewEmail_inBrowser(theMail);
  }

  if (
    process.env["send-out-mail-without-job-queue-usage_DEV_ONLY"] &&
    process.env.APP_ENV !== "production"
  ) {
    return sendMailViaOutgoingMailer(theMail, reason, outgoingMailer);
  }

  if (isTestEnv) return;

  const queue = QueueNames["send-mail"];

  const jobQueue = await getJobQueue();

  const data: z.infer<typeof ZJobData_Mail> = {
    mail: ZMail.parse(theMail),
    reason,
    outgoingMailer,
  };

  const retryDelay_inSeconds = 30;

  await jobQueue.send(queue, data, {
    /** Max number of retries of failed jobs */
    retryLimit: 3,
    retryDelay: retryDelay_inSeconds,
    /**
     * Enables exponential backoff retries based on retryDelay instead of a fixed delay
     * 30**1 = 30s
     * 30**2 = 900s = 15min
     * 30**3 = 27000s = 7.5h
     * */
    retryBackoff: true,
  });
}

export async function handleJob_sendMail(job: Job) {
  const { mail, reason, outgoingMailer } = ZJobData_Mail.parse(job.data);

  const strategy = (() => {
    const isRunning_asProdVersion_locallyInDocker = process.env.S3_USE_DEVELOPMENT_BUCKET;

    if (process.env.APP_ENV === "production" && !isRunning_asProdVersion_locallyInDocker) {
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

async function sendMailViaOutgoingMailer(
  mail: TMail,
  reason: string,
  outgoingMailer: TMailOutgoingMailer,
) {
  if (outgoingMailer.type === "internal") {
    await sendMailViaSmtp(mail, reason);
    return;
  }

  if (outgoingMailer.type === "organisationOutgoingMailer") {
    const smtpConfig = await db.organisationOutgoingMailerSmtpConfig.findUnique({
      where: { outgoingMailerUuid: outgoingMailer.outgoingMailerUuid },
      select: {
        senderName: true,
        senderEmail: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        passwordEncrypted: true,
      },
    });

    if (!smtpConfig) throw new Error("SMTP-Konfiguration für Mailversand nicht gefunden.");

    await sendMailViaCustomSmtp(mail, reason, {
      senderName: smtpConfig.senderName,
      senderEmail: smtpConfig.senderEmail,
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      username: smtpConfig.username,
      password: decryptOutgoingMailerSecret(smtpConfig.passwordEncrypted),
    });
    return;
  }

  const exhaustiveCheck: never = outgoingMailer;
  throw new Error(`Unsupported outgoing mailer: ${exhaustiveCheck}`);
}

/**
 * @deprecated This function should not be directly used outside this module.
 * We want to enqueue mails in job queue via the 'sendMail' function and not directly send them via SMTP in api-calls.
 */
export async function sendMailViaSmtp(mail: TMail, reason: string) {
  const mailSentResult = await Result.fromAsync(async () => {
    return new Promise<SMTPTransport.SentMessageInfo>((resolve, reject) => {
      defaultMailTransporter.sendMail(
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
          attachments: (() => {
            const returnArr: Attachment[] = [];

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
          })(),
        },
        (err, info) => {
          if (err) reject(err);
          else resolve(info);
        },
      );
    });
  });

  if (mailSentResult.isOk()) {
    console.log(`Successfully sent eMail to: ${mail.to} - reason: ${reason}`);
  }

  if (mailSentResult.isErr()) {
    console.error(
      `Failed to sent eMail to: ${mail.to} - reason: ${reason}`,
      mailSentResult.unwrapErr(),
    );
    throw mailSentResult.unwrapErr();
  }
}

async function sendMailViaCustomSmtp(
  mail: TMail,
  reason: string,
  config: {
    senderName: string;
    senderEmail: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  },
) {
  const transporter = nodemailer.createTransport({
    secure: config.secure,
    port: config.port,
    host: config.host,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  transporter.use("compile", htmlToText());

  const mailSentResult = await Result.fromAsync(async () => {
    return new Promise<SMTPTransport.SentMessageInfo>((resolve, reject) => {
      transporter.sendMail(
        {
          ...mail,
          from: { name: config.senderName, address: config.senderEmail },
          envelope: { from: config.senderEmail, to: mail.to },
          icalEvent: undefined,
          attachments: buildMailAttachments(mail),
        },
        (err, info) => {
          if (err) reject(err);
          else resolve(info);
        },
      );
    });
  });

  if (mailSentResult.isOk()) {
    console.log(`Successfully sent custom SMTP eMail to: ${mail.to} - reason: ${reason}`);
  }

  if (mailSentResult.isErr()) {
    console.error(
      `Failed to sent custom SMTP eMail to: ${mail.to} - reason: ${reason}`,
      mailSentResult.unwrapErr(),
    );
    throw mailSentResult.unwrapErr();
  }
}

function buildMailAttachments(mail: TMail): Attachment[] | undefined {
  const returnArr: Attachment[] = [];

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

const defaultMailTransporter = createNodeMailerTransporter();

function createNodeMailerTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  const key_globalThis = "__nodemailer_transport-instance__";

  // @ts-ignore
  if (globalThis[key_globalThis]) return globalThis[key_globalThis];

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

  // @ts-ignore
  globalThis[key_globalThis] = transporter;

  return transporter;
}
