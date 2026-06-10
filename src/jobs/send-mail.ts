import { z } from "zod";

import {
  handleJob_sendMail,
  ZMail,
  ZMailOutgoingMailer,
  ZMailTransport,
} from "src/integrations/mailer";
import { jobs } from "src/integrations/job-queue";

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
