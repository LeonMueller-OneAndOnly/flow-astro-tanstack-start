import z from "zod";

const ZMailAttachment = z.object({
  filename: z.string().optional(),
  content: z.string(),
  contentType: z.string().optional(),
  encoding: z.string().optional(),
});

const ZMailAddress = z.union([z.email(), z.array(z.email())]);

export const ZMail = z.object({
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
      content: z.string(),
      method: z.string(),
    })
    .optional(),
});

export type TMail = z.infer<typeof ZMail>;
