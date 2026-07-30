import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, FileDown, RefreshCw } from "lucide-react";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { brandPageBackground, brandPrimaryButtonClass } from "../../lib/brand-theme";
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
    <div
      className="min-h-screen bg-background px-6 py-12 text-foreground"
      style={brandPageBackground}
    >
      <div className="mx-auto max-w-5xl">
        <BackLink to="/demo" />
        <div className="mb-8 rounded-3xl border border-foreground/10 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
            Reference example
          </p>
          <h1 className="mb-4 max-w-3xl text-4xl font-black tracking-tight text-foreground md:text-5xl">
            File uploads with local Flydrive storage
          </h1>
          <p className="mb-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            This demo stores upload metadata in the demo_user_uploads table, stores bytes through
            Flydrive, and reads everything back through a TanStack API route. Treat it as
            starter-kit reference code, not a finished product flow.
          </p>
          <DemoExplainer feature="TanStack API route (multipart upload)" className="mb-0 max-w-3xl">
            One route handler answers both verbs: <code>GET</code> lists stored files and
            <code>POST</code> receives the <code>multipart/form-data</code> upload. The client just
            posts a <code>FormData</code> body to <code>/app/demo/api/uploads</code>.
          </DemoExplainer>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-foreground/10 bg-card/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <CloudUpload className="h-8 w-8 text-brand-primary-600" />
              <div>
                <h2 className="text-xl font-semibold">Upload</h2>
                <p className="text-sm text-muted-foreground">Max 5 MB in this example.</p>
              </div>
            </div>

            <input
              aria-label="File to upload"
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mb-4 block w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-foreground file:px-4 file:py-2 file:font-semibold file:text-background"
            />

            <button
              type="button"
              onClick={uploadFile}
              disabled={isPending}
              className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 ${brandPrimaryButtonClass}`}
            >
              {isPending ? "Uploading" : "Upload file"}
            </button>

            <p className="mt-4 rounded-xl border border-foreground/10 bg-foreground/5 p-3 text-sm text-muted-foreground">
              {message}
            </p>

            <div className="mt-4 rounded-xl bg-foreground/5 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">Local root</p>
              <code className="break-all">{uploadsRoot || "Loading..."}</code>
            </div>
          </section>

          <section className="rounded-2xl border border-foreground/10 bg-card/70 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Stored files</h2>
                <p className="text-sm text-muted-foreground">
                  Listed from the demo_user_uploads table.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshFiles}
                className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-brand-primary-500 hover:text-brand-primary-700"
                aria-label="Refresh uploads"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {files.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                No uploaded files yet.
              </p>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 transition-colors hover:border-brand-primary-500/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(file.size)} · {file.contentType} · {file.disk} ·{" "}
                        {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <FileDown className="h-5 w-5 shrink-0 text-brand-primary-600" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-foreground/10 bg-card/70 p-6 text-sm leading-7 text-muted-foreground">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Migration note</h2>
          <p>
            This example uses a local filesystem driver. To migrate to S3 or R2, swap the driver in{" "}
            <code className="text-brand-secondary-700">src/integrations/storage.ts</code> and keep
            storing database records by stable object key rather than by local path.
          </p>
        </section>
      </div>
    </div>
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
