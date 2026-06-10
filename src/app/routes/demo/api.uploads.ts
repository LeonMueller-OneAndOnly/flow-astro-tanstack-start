import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

import { db } from "../../../db/client";
import { demoUserUploads } from "../../../db/schema";
import { UploadDisk, localFilesystemDisk, getUploadDir } from "../../../integrations/storage";

export const MAX_DEMO_UPLOAD_BYTES = 5 * 1024 * 1024;
export const DEMO_UPLOAD_PREFIX = "demo-uploads";

/**
 * Reference-only upload API served at `/app/demo/api/uploads`.
 * Real apps should attach ownership/authorization and use S3/R2 signed URLs for larger files.
 */
export const Route = createFileRoute("/demo/api/uploads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");

        if (key) {
          return downloadUpload(key);
        }

        return json({
          uploadsRoot: getUploadDir(),
          files: await listUploads(),
        });
      },
      POST: async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
          return json({ error: "Choose a file to upload." }, { status: 400 });
        }

        if (file.size === 0) {
          return json({ error: "Empty files are not accepted by this example." }, { status: 400 });
        }

        if (file.size > MAX_DEMO_UPLOAD_BYTES) {
          return json({ error: "This example accepts files up to 5 MB." }, { status: 400 });
        }

        const contentType = file.type || "application/octet-stream";
        const originalName = file.name || "upload.bin";
        const key = createDemoUploadKey(originalName);
        const bytes = new Uint8Array(await file.arrayBuffer());

        await localFilesystemDisk.put(key, bytes, {
          contentLength: file.size,
          contentType,
          visibility: "private",
        });

        const [upload] = await db
          .insert(demoUserUploads)
          .values({
            id: randomUUID(),
            storageKey: key,
            originalName,
            contentType,
            size: file.size,
            disk: UploadDisk,
            createdAt: new Date(),
          })
          .returning();

        return json({ file: serializeUpload(upload) }, { status: 201 });
      },
    },
  },
});

async function listUploads() {
  const uploads = await db.select().from(demoUserUploads).orderBy(desc(demoUserUploads.createdAt));
  return uploads.map(serializeUpload);
}

function serializeUpload(upload: typeof demoUserUploads.$inferSelect) {
  return {
    id: upload.id,
    key: upload.storageKey,
    name: upload.originalName,
    contentType: upload.contentType,
    size: upload.size,
    disk: upload.disk,
    createdAt: upload.createdAt.toISOString(),
    url: `/app/demo/api/uploads?key=${encodeURIComponent(upload.storageKey)}`,
  };
}

async function downloadUpload(key: string) {
  const [upload] = await db
    .select()
    .from(demoUserUploads)
    .where(eq(demoUserUploads.storageKey, key))
    .limit(1);

  if (!upload || !isDemoUploadKey(key) || !(await localFilesystemDisk.exists(key))) {
    return json({ error: "File not found." }, { status: 404 });
  }

  const bytes = await localFilesystemDisk.getBytes(key);
  const name = upload.originalName.replaceAll('"', "");
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(upload.size),
      "Content-Type": upload.contentType,
    },
  });
}

function createDemoUploadKey(fileName: string) {
  const safeName = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return `${DEMO_UPLOAD_PREFIX}/${randomUUID()}/${safeName || "upload.bin"}`;
}

function isDemoUploadKey(key: string) {
  return key.startsWith(`${DEMO_UPLOAD_PREFIX}/`);
}
