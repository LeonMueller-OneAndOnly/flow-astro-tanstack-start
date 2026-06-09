import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

import {
  createDemoUploadKey,
  DEMO_UPLOAD_PREFIX,
  demoUploadDisk,
  getDemoUploadsRoot,
  isDemoUploadKey,
  MAX_DEMO_UPLOAD_BYTES,
} from "../../lib/demo-file-storage";

/**
 * Reference-only upload API served at `/app/demo/api/uploads`.
 * Real apps should persist Flydrive file snapshots or storage keys in the database.
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
          uploadsRoot: getDemoUploadsRoot(),
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

        const key = createDemoUploadKey(file.name);
        const bytes = new Uint8Array(await file.arrayBuffer());

        await demoUploadDisk.put(key, bytes, {
          contentLength: file.size,
          contentType: file.type || "application/octet-stream",
          visibility: "private",
        });

        return json({ file: await describeUpload(key) }, { status: 201 });
      },
    },
  },
});

async function listUploads() {
  const listing = await demoUploadDisk.listAll(DEMO_UPLOAD_PREFIX, { recursive: true });
  const files = await Promise.all(
    Array.from(listing.objects)
      .filter((object) => object.isFile)
      .map((file) => describeUpload(file.key)),
  );

  return files.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

async function describeUpload(key: string) {
  const metadata = await demoUploadDisk.getMetaData(key);

  return {
    key,
    name: key.split("/").at(-1) ?? key,
    contentType: metadata.contentType ?? "application/octet-stream",
    size: metadata.contentLength,
    lastModified: metadata.lastModified.toISOString(),
    url: `/app/demo/api/uploads?key=${encodeURIComponent(key)}`,
  };
}

async function downloadUpload(key: string) {
  if (!isDemoUploadKey(key) || !(await demoUploadDisk.exists(key))) {
    return json({ error: "File not found." }, { status: 404 });
  }

  const [metadata, bytes] = await Promise.all([
    demoUploadDisk.getMetaData(key),
    demoUploadDisk.getBytes(key),
  ]);
  const name = (key.split("/").at(-1) ?? "download").replaceAll('"', "");

  return new Response(bytes, {
    headers: {
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(metadata.contentLength),
      "Content-Type": metadata.contentType ?? "application/octet-stream",
    },
  });
}
