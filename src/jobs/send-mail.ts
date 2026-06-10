import { jobs } from "src/integrations/job-queue";
import { handleJob_sendMail, ZMailOutgoingMailer, ZMailTransport } from "src/integrations/mailer";

import { ZMail } from "src/integrations/mailer/types";
import { z } from "zod";

const ZSendMailJobPayload = z.object({
  mail: ZMail,
  reason: z.string(),
  outgoingMailer: ZMailOutgoingMailer.default({ type: "internal" }),
  transport: ZMailTransport,
});

export const sendMailJob = jobs.defineJob({
  name: "send-mail",
  schema: ZSendMailJobPayload,
  async handler({ mail, reason, outgoingMailer, transport }) {
    await handleJob_sendMail(mail, reason, outgoingMailer, transport);

    return { to: mail.to, reason };
  },
});
