import { sendMailJob } from "src/jobs/send-mail";

import { ZMail, type TMail, type TMailTransport } from "./types";

import { z } from "zod";

export const ZMailOutgoingMailer = z.object({ type: z.literal("internal") });

export type TMailOutgoingMailer = z.infer<typeof ZMailOutgoingMailer>;

const isTestEnv = process.env.APP_ENV === "test";

export async function sendMail(input: {
  mail: TMail;
  /** specify mailer type via free form string */
  reason: string;
}) {
  const mail = ZMail.parse(input.mail);

  const transport = getMailTransport();

  if (transport === "ignore") {
    return null;
  }

  return await sendMailJob.enqueue({ mail, reason: input.reason, transport }, { maxAttempts: 3 });
}

function getMailTransport(): TMailTransport {
  if (process.env["open-preview-for-all-mails_DEV_ONLY"] && process.env.APP_ENV !== "production") {
    return "preview-in-browser";
  }

  if (isTestEnv) return "ignore";

  if (process.env.APP_ENV === "production") return "send-via-smtp";

  return "preview-in-browser";
}
