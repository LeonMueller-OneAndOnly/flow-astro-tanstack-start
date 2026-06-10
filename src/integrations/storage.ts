import path from "node:path";

import { UPLOADS_DIR } from "astro:env/server";
import { Disk } from "flydrive";
import { FSDriver } from "flydrive/drivers/fs";

export const UploadDisk = "local";

export const localFilesystemDisk = new Disk(
  new FSDriver({
    location: getUploadDir(),
    visibility: "private",
  }),
);

export function getUploadDir() {
  return path.isAbsolute(UPLOADS_DIR) ? UPLOADS_DIR : path.resolve(process.cwd(), UPLOADS_DIR);
}
