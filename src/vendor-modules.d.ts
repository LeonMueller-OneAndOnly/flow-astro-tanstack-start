declare module "nodemailer-html-to-text" {
  export function htmlToText(): any;
}

declare module "preview-email" {
  function previewEmail(message: unknown): Promise<string>;

  export = previewEmail;
}
