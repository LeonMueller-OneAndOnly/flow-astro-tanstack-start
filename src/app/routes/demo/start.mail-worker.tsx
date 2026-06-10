import { type FormEvent, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { BackLink } from "@/components/BackLink";
import { DemoExplainer } from "@/components/DemoExplainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brandPageBackground, brandPrimaryButtonClass } from "@/lib/brand-theme";
import { Result } from "@/lib/result";

const ZMailWorkerInput = z.object({
  to: z.email(),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

type MailWorkerInput = z.infer<typeof ZMailWorkerInput>;

type QueueMailResult =
  | { success: true; jobId: number; to: string }
  | { success: false; error: string };

const queueMail = createServerFn({ method: "POST" })
  .inputValidator((data: MailWorkerInput) => data)
  .handler(async ({ data }): Promise<QueueMailResult> => {
    const parsedInput = ZMailWorkerInput.safeParse(data);

    if (!parsedInput.success) {
      return {
        success: false,
        error: parsedInput.error.issues[0]?.message ?? "Invalid mail input",
      };
    }

    const { sendMailJob } = await import("src/jobs/send-mail");
    const jobResult = await Result.fromAsync(() =>
      sendMailJob.enqueue(
        {
          mail: {
            to: parsedInput.data.to,
            subject: parsedInput.data.subject,
            text: parsedInput.data.message,
            html: `<p>${escapeHtml(parsedInput.data.message).replaceAll("\n", "<br>")}</p>`,
          },
          reason: "manual mail worker test",
          transport: "preview-in-browser",
        },
        { maxAttempts: 1 },
      ),
    );

    if (!jobResult.success) return { success: false, error: jobResult.error.message };

    return { success: true, jobId: jobResult.data.id, to: parsedInput.data.to };
  });

/** Served at `/app/demo/start/mail-worker`; TanStack route paths are mounted under Astro's `/app` catch-all. */
export const Route = createFileRoute("/demo/start/mail-worker")({
  component: MailWorkerTestPage,
});

function MailWorkerTestPage() {
  const [form, setForm] = useState<MailWorkerInput>({
    to: "test@example.com",
    subject: "Job queue mail test",
    message: "If the worker is running, this opens as a preview email after the job is processed.",
  });
  const [status, setStatus] = useState<QueueMailResult | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitMail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(undefined);

    const result = await Result.fromAsync(() => queueMail({ data: form }));

    setIsSubmitting(false);
    setStatus(result.success ? result.data : { success: false, error: result.error.message });
  }

  return (
    <main
      className="min-h-screen bg-background px-6 py-16 text-foreground"
      style={brandPageBackground}
    >
      <div className="mx-auto max-w-3xl">
        <BackLink to="/demo" />
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-brand-secondary-700">
            Worker smoke test
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Queue a preview email</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Submitting this form inserts a <code>send-mail</code> job. The background worker should
            pick it up and open the generated email preview.
          </p>
          <DemoExplainer feature="Server function → background job queue" className="mt-6 max-w-2xl">
            The form calls a POST server function that validates input with Zod and only{" "}
            <em>enqueues</em> a job — it returns immediately. A separate worker process drains the
            queue and does the slow work, so the request never blocks on sending mail.
          </DemoExplainer>
        </div>

        <Card className="border-foreground/10 bg-card/80 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Mail job payload</CardTitle>
            <CardDescription>
              Uses <code>preview-in-browser</code>; no SMTP configuration is needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitMail}>
              <div className="space-y-2">
                <Label htmlFor="mail-to">Recipient</Label>
                <Input
                  id="mail-to"
                  type="email"
                  value={form.to}
                  onChange={(event) => setForm({ ...form, to: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail-subject">Subject</Label>
                <Input
                  id="mail-subject"
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail-message">Message</Label>
                <Textarea
                  id="mail-message"
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  className="min-h-36"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" disabled={isSubmitting} className={brandPrimaryButtonClass}>
                  {isSubmitting ? "Queueing..." : "Queue mail job"}
                </Button>
                {status?.success ? (
                  <p className="text-sm font-medium text-emerald-600">
                    Queued job #{status.jobId} for {status.to}. Watch for the preview window.
                  </p>
                ) : null}
                {status && !status.success ? (
                  <p className="text-sm text-destructive">{status.error}</p>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
