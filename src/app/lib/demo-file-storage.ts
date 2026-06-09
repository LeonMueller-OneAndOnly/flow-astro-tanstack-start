import path from "node:path";
import { randomUUID } from "node:crypto";

import { UPLOADS_DIR } from "astro:env/server";
import { Disk } from "flydrive";
import { FSDriver } from "flydrive/drivers/fs";

export const DEMO_UPLOAD_PREFIX = "demo-uploads";
export const MAX_DEMO_UPLOAD_BYTES = 5 * 1024 * 1024;

export const demoUploadDisk = new Disk(
  new FSDriver({
    location: getDemoUploadsRoot(),
    visibility: "private",
  }),
);

export function getDemoUploadsRoot() {
  return path.isAbsolute(UPLOADS_DIR) ? UPLOADS_DIR : path.resolve(process.cwd(), UPLOADS_DIR);
}

export function createDemoUploadKey(fileName: string) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return `${DEMO_UPLOAD_PREFIX}/${randomUUID()}/${safeName || "upload.bin"}`;
}

export function isDemoUploadKey(key: string) {
  return key.startsWith(`${DEMO_UPLOAD_PREFIX}/`);
}
