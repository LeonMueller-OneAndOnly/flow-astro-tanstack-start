import path from "node:path";

import { UPLOADS_DIR } from "astro:env/server";
import { Disk } from "flydrive";
import { FSDriver } from "flydrive/drivers/fs";

export const UploadDisk = "local";

let localFilesystemDisk: Disk | undefined;

export function getLocalFilesystemDisk() {
  localFilesystemDisk ??= new Disk(
    new FSDriver({
      location: getUploadDir(),
      visibility: "private",
    }),
  );

  return localFilesystemDisk;
}

export function getUploadDir() {
  const uploadsDir = UPLOADS_DIR?.trim() || ".data/user-uploads";

  return path.isAbsolute(uploadsDir) ? uploadsDir : path.resolve(process.cwd(), uploadsDir);
}
