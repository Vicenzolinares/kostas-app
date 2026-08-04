"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, Input, Label, Textarea } from "@kostas/ui";
import {
  composeEmailSchema,
  type ComposeEmailInput,
} from "@kostas/shared/schemas";
import { composeEmailAction } from "../api/actions";

// The compose form collects recipients as comma-separated text inputs;
// this schema validates that shape and is converted to the array-based
// composeEmailSchema before submission.
const composeFormSchema = z.object({
  to: z.string().trim().min(1, "Add at least one recipient"),
  cc: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  bodyHtml: z.string().trim().min(1, "Message body is required"),
});
type ComposeFormValues = z.infer<typeof composeFormSchema>;

function splitAddresses(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);
}

export interface ComposeFormProps {
  /** Prefilled values for reply/forward; empty for a fresh message. */
  defaultValues?: Partial<ComposeFormValues>;
  /** Carried through so replies stay attached to the same project. */
  projectId?: string | null;
  /** Threads the reply to its parent via the RFC In-Reply-To header. */
  inReplyToMessageId?: string | null;
  /** True when messages are stored locally instead of being delivered. */
  demoMode?: boolean;
}

export function ComposeForm({
  defaultValues,
  projectId,
  inReplyToMessageId,
  demoMode = false,
}: ComposeFormProps = {}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeFormSchema),
    defaultValues,
  });

  function onSubmit(values: ComposeFormValues) {
    setError(null);
    const payload: ComposeEmailInput = {
      to: splitAddresses(values.to),
      cc: splitAddresses(values.cc),
      subject: values.subject,
      bodyHtml: values.bodyHtml,
      projectId: projectId ?? null,
      inReplyToMessageId: inReplyToMessageId ?? null,
    };

    const parsed = composeEmailSchema.safeParse(payload);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Please check the form for errors.",
      );
      return;
    }

    startTransition(async () => {
      const result = await composeEmailAction(parsed.data);
      if (result.success) {
        router.push("/emails");
      } else {
        setError(result.error ?? "Please check the form for errors.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">To (comma-separated)</Label>
            <Input
              id="to"
              placeholder="client@example.com"
              {...register("to")}
            />
            {errors.to ? (
              <p className="text-xs text-destructive">{errors.to.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cc">CC (comma-separated, optional)</Label>
            <Input id="cc" {...register("cc")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register("subject")} />
            {errors.subject ? (
              <p className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bodyHtml">Message</Label>
            <Textarea id="bodyHtml" rows={10} {...register("bodyHtml")} />
            {errors.bodyHtml ? (
              <p className="text-xs text-destructive">
                {errors.bodyHtml.message}
              </p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-between gap-4">
            {demoMode ? (
              <p className="text-xs text-muted-foreground">
                Demo mode — this message is saved to the local mailbox and is
                not delivered.
              </p>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending
                ? demoMode
                  ? "Saving…"
                  : "Sending…"
                : demoMode
                  ? "Save to mailbox"
                  : "Send"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
