import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Button } from "@/components/ui/button";
import { $appPath } from "../../lib/framework/typesafe-paths";

type DemoUpload = {
  id: string;
  key: string;
  name: string;
  contentType: string;
  size: number;
  disk: string;
  createdAt: string;
  url: string;
};

type UploadListResponse = {
  uploadsRoot: string;
  files: Array<DemoUpload>;
};

const uploadsApiPath = $appPath({ to: "/demo/api/uploads" });

/** Served at `/app/demo/start/uploads`; this is a reference-only file upload example. */
export const Route = createFileRoute("/demo/start/uploads")({
  component: UploadsDemo,
});

function UploadsDemo() {
  const [files, setFiles] = useState<Array<DemoUpload>>([]);
  const [uploadsRoot, setUploadsRoot] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("Choose a small file to store through Flydrive.");
  const [isPending, setIsPending] = useState(false);

  const refreshFiles = async () => {
    const response = await fetch(uploadsApiPath);
    const data = (await response.json()) as UploadListResponse;
    setUploadsRoot(data.uploadsRoot);
    setFiles(data.files);
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const uploadFile = async () => {
    if (!selectedFile) {
      setMessage("Choose a file first.");
      return;
    }

    setIsPending(true);
    setMessage("Uploading...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(uploadsApiPath, {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Upload failed.");
      setIsPending(false);
      return;
    }

    setSelectedFile(null);
    setMessage("Uploaded. The app stored metadata in demo_user_uploads and the file in Flydrive.");
    await refreshFiles();
    setIsPending(false);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-10 pb-24">
      <BackLink to="/demo" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        File uploads with local Flydrive storage
      </h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
        This demo stores upload metadata in the <code>demo_user_uploads</code> table, stores bytes
        through Flydrive, and reads everything back through a TanStack API route. Treat it as
        starter-kit reference code, not a finished product flow.
      </p>
      <DemoExplainer feature="TanStack API route (multipart upload)" className="mt-6 max-w-3xl">
        One route handler answers both verbs: <code>GET</code> lists stored files and{" "}
        <code>POST</code> receives the <code>multipart/form-data</code> upload. The client just
        posts a <code>FormData</code> body to <code>/app/demo/api/uploads</code>.
      </DemoExplainer>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="shadow-soft rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold tracking-tight">Upload</h2>
          <p className="mt-1 text-sm text-muted-foreground">Max 5 MB in this example.</p>

          <input
            aria-label="File to upload"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="mt-5 block w-full rounded-md border border-input bg-transparent p-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          />

          <Button type="button" onClick={uploadFile} disabled={isPending} className="mt-4 w-full">
            {isPending ? "Uploading" : "Upload file"}
          </Button>

          <p className="mt-4 text-sm text-muted-foreground">{message}</p>

          <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Local root</p>
            <code className="mt-1 inline-block break-all">{uploadsRoot || "Loading..."}</code>
          </div>
        </section>

        <section className="shadow-soft rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Stored files</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Listed from the <code>demo_user_uploads</code> table.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={refreshFiles}
              aria-label="Refresh uploads"
            >
              <RefreshCw />
            </Button>
          </div>

          {files.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
              No uploaded files yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {files.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.url}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand-ink"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{file.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatBytes(file.size)} · {file.contentType} · {file.disk} ·{" "}
                        {formatDate(file.createdAt)}
                      </span>
                    </span>
                    <FileDown className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl bg-secondary/60 p-6">
        <h2 className="font-semibold tracking-tight">Migration note</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This example uses a local filesystem driver. To migrate to S3 or R2, swap the driver in{" "}
          <code>src/integrations/storage.ts</code> and keep storing database records by stable
          object key rather than by local path.
        </p>
      </section>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
