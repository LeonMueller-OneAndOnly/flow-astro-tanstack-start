import z from "zod";

const ZMailAttachment = z.object({
  filename: z.string().optional(),
  content: z.any(),
  contentType: z.string().optional(),
  encoding: z.string().optional(),
});

const ZMailAddress = z.union([
  z.string(),
  z.array(z.string()),
  z.object({ name: z.string().optional(), address: z.string() }),
  z.array(z.object({ name: z.string().optional(), address: z.string() })),
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
