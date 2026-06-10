import { sendMailJob } from "./jobs/send-mail";
import {
  isTestEnv,
  previewEmail_inBrowser,
  sendMailViaOutgoingMailer,
  ZMail,
  ZMailOutgoingMailer,
} from "./core";
import type { TMail, TMailOutgoingMailer } from "./core";

export {
  handleJob_sendMail,
  sendMailViaOutgoingMailer,
  sendMailViaSmtp,
  ZMail,
  ZMailOutgoingMailer,
} from "./core";
export type { TMail, TMailOutgoingMailer } from "./core";

export async function sendMail(
  theMail: TMail,
  reason: string,
  options?: { outgoingMailer?: TMailOutgoingMailer },
) {
  const mail = ZMail.parse(theMail);
  const outgoingMailer = ZMailOutgoingMailer.parse(options?.outgoingMailer ?? { type: "internal" });

  if (process.env["open-preview-for-all-mails_DEV_ONLY"] && process.env.APP_ENV !== "production") {
    return previewEmail_inBrowser(mail);
  }

  if (
    process.env["send-out-mail-without-job-queue-usage_DEV_ONLY"] &&
    process.env.APP_ENV !== "production"
  ) {
    return sendMailViaOutgoingMailer(mail, reason, outgoingMailer);
  }

  if (isTestEnv) return;

  await sendMailJob.enqueue({ mail, reason, outgoingMailer }, { maxAttempts: 3 });
}
