import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, FileDown, RefreshCw } from "lucide-react";

type DemoUpload = {
  key: string;
  name: string;
  contentType: string;
  size: number;
  lastModified: string;
  url: string;
};

type UploadListResponse = {
  uploadsRoot: string;
  files: Array<DemoUpload>;
};

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
    const response = await fetch("/app/demo/api/uploads");
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

    const response = await fetch("/app/demo/api/uploads", {
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
    setMessage("Uploaded. The app stored a Flydrive key, not a filesystem path.");
    await refreshFiles();
    setIsPending(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-stone-900 to-stone-950 p-8 shadow-2xl shadow-black/30">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
            Reference example
          </p>
          <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            File uploads with local Flydrive storage
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-stone-300">
            This demo stores uploads under the configured local upload directory and reads them back
            through an API route. Treat it as starter-kit reference code, not a finished product
            flow.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6">
            <div className="mb-5 flex items-center gap-3">
              <CloudUpload className="h-8 w-8 text-amber-300" />
              <div>
                <h2 className="text-xl font-semibold">Upload</h2>
                <p className="text-sm text-stone-400">Max 5 MB in this example.</p>
              </div>
            </div>

            <input
              aria-label="File to upload"
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mb-4 block w-full rounded-xl border border-stone-700 bg-stone-950 p-3 text-sm text-stone-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:font-semibold file:text-stone-950"
            />

            <button
              type="button"
              onClick={uploadFile}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-5 py-3 font-semibold text-stone-950 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Uploading" : "Upload file"}
            </button>

            <p className="mt-4 rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm text-stone-300">
              {message}
            </p>

            <div className="mt-4 rounded-xl bg-stone-950 p-3 text-xs text-stone-500">
              <p className="mb-1 font-semibold text-stone-400">Local root</p>
              <code className="break-all">{uploadsRoot || "Loading..."}</code>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Stored files</h2>
                <p className="text-sm text-stone-400">Listed from Flydrive using storage keys.</p>
              </div>
              <button
                type="button"
                onClick={refreshFiles}
                className="rounded-lg border border-stone-700 p-2 text-stone-300 transition-colors hover:border-amber-300 hover:text-amber-200"
                aria-label="Refresh uploads"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {files.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-700 p-6 text-center text-stone-400">
                No uploaded files yet.
              </p>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <a
                    key={file.key}
                    href={file.url}
                    className="flex items-center justify-between gap-4 rounded-xl border border-stone-800 bg-stone-950 p-4 transition-colors hover:border-amber-300/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-100">{file.name}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatBytes(file.size)} · {file.contentType} ·{" "}
                        {formatDate(file.lastModified)}
                      </p>
                    </div>
                    <FileDown className="h-5 w-5 shrink-0 text-amber-300" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/70 p-6 text-sm leading-7 text-stone-300">
          <h2 className="mb-2 text-lg font-semibold text-white">Migration note</h2>
          <p>
            This example uses Flydrive's local filesystem driver. To migrate to S3 or R2, swap the
            driver in <code className="text-amber-200">src/app/lib/demo-file-storage.ts</code> and
            keep storing database records by stable object key rather than by local path.
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
