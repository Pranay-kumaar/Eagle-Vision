"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Send,
  FileInput,
  FileCheck2,
  MailCheck,
  MailPlus,
  BotMessageSquare,
  CheckCheck,
  MailWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type CategoryValue = "general" | "bug" | "billing" | "partnership" | "feature";

export interface ContactFeedbackProps {
  className?: string;
  style?: React.CSSProperties;
  onSubmit?: (payload: {
    name?: string;
    email: string;
    message: string;
    category: CategoryValue;
    files: File[];
    meta?: Record<string, unknown>;
  }) => Promise<{ ok: boolean; ticketId?: string; error?: string }>;
  defaultCategory?: CategoryValue;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
  category?: string;
  files?: string;
  human?: string;
}

const categories: { value: CategoryValue; label: string; hint: string }[] = [
  { value: "general", label: "General inquiry", hint: "Questions, guidance, or feedback" },
  { value: "bug", label: "Bug report", hint: "Something broken or not working" },
  { value: "feature", label: "Feature request", hint: "Suggest improvements" },
  { value: "billing", label: "Billing & accounts", hint: "Invoices, plans, access" },
  { value: "partnership", label: "Partnership", hint: "Collaborations and alliances" },
];

export default function ContactFeedback({
  className,
  style,
  onSubmit,
  defaultCategory,
}: ContactFeedbackProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [category, setCategory] = React.useState<CategoryValue | undefined>(defaultCategory);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isHuman, setIsHuman] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<{ ticketId?: string } | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [hp, setHp] = React.useState(""); // honeypot

  const emailValid = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!emailValid(email)) next.email = "Enter a valid email address";

    if (!message.trim()) next.message = "Message is required";
    else if (message.trim().length < 10)
      next.message = "Message should be at least 10 characters";

    if (!category) next.category = "Select a category";

    if (!isHuman) next.human = "Please confirm you are not a robot";

    if (files.length > 5) next.files = "You can attach up to 5 files";
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const maxTotal = 10 * 1024 * 1024; // 10MB
    if (totalSize > maxTotal) next.files = "Total attachments must be under 10MB";

    if (hp) {
      next.message = "Spam detected";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 5);
    setFiles(next);
    // Soft validation feedback
    const total = next.reduce((s, f) => s + f.size, 0);
    if (total > 10 * 1024 * 1024) {
      toast.error("Attachments exceed 10MB total. Please remove some files.");
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function defaultSubmit(payload: {
    name?: string;
    email: string;
    message: string;
    category: CategoryValue;
    files: File[];
    meta?: Record<string, unknown>;
  }) {
    // Build form data to support files
    const form = new FormData();
    form.set("name", payload.name ?? "");
    form.set("email", payload.email);
    form.set("message", payload.message);
    form.set("category", payload.category);
    form.set("meta", JSON.stringify(payload.meta ?? {}));
    payload.files.forEach((f, i) => form.append("files", f, f.name));

    const res = await fetch("/api/support/tickets", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false as const, error: text || "Failed to submit" };
    }

    const data = (await res.json().catch(() => ({}))) as {
      ticketId?: string;
      emailQueued?: boolean;
    };

    // Attempt to trigger confirmation email if not already queued server-side
    try {
      await fetch("/api/support/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          ticketId: data.ticketId,
          category: payload.category,
        }),
      });
    } catch {
      // non-blocking
    }

    return { ok: true as const, ticketId: data.ticketId };
  }

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        name: name.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
        category: category!,
        files,
        meta: {
          source: "contact-component",
          ts: Date.now(),
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        },
      };

      const submitFn = onSubmit ?? defaultSubmit;
      const res = await submitFn(payload);

      if (res.ok) {
        const ticketId =
          res.ticketId ||
          `EV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
            .toString()
            .slice(-4)}`;
        setSuccess({ ticketId });
        toast.success("Thanks! Your message has been received.");
        // Reset form after success
        setName("");
        setEmail("");
        setMessage("");
        setCategory(undefined);
        setFiles([]);
        setIsHuman(false);
      } else {
        toast.error(res.error || "We couldn't submit your request. Try again.");
      }
    } catch (err) {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-lg bg-card shadow-sm ring-1 ring-border",
        "p-5 sm:p-6 md:p-8",
        className
      )}
      style={style}
      aria-labelledby="contact-title"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface-1 text-primary ring-1 ring-border">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2
            id="contact-title"
            className="font-heading text-lg sm:text-xl md:text-2xl"
          >
            Contact Eagle Vision Support
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Typically responds within 24 hours. We’ll create a support ticket and send a confirmation email.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <form onSubmit={onSubmitForm} noValidate className="space-y-5">
            {/* Honeypot */}
            <div className="sr-only">
              <Label htmlFor="hp">Leave this field empty</Label>
              <Input
                id="hp"
                name="company"
                autoComplete="organization"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                tabIndex={-1}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 bg-surface-1"
                  autoComplete="name"
                />
              </div>

              <div className="min-w-0">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "mt-2 bg-surface-1",
                    errors.email && "ring-1 ring-destructive focus-visible:ring-destructive"
                  )}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                />
                {errors.email && (
                  <p id="email-error" className="mt-2 text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v: CategoryValue) => setCategory(v)}
                >
                  <SelectTrigger
                    id="category"
                    className={cn(
                      "mt-2 bg-surface-1",
                      errors.category &&
                        "ring-1 ring-destructive focus-visible:ring-destructive"
                    )}
                    aria-invalid={!!errors.category}
                    aria-describedby={errors.category ? "category-error" : undefined}
                  >
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{c.label}</span>
                          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                            {c.hint}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p id="category-error" className="mt-2 text-xs text-destructive">
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <Label htmlFor="files">Attachments</Label>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative">
                    <Input
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="bg-surface-1 file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:text-secondary-foreground hover:file:bg-muted"
                    />
                  </div>
                  <FileInput className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                {errors.files && (
                  <p className="mt-2 text-xs text-destructive">{errors.files}</p>
                )}
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-md bg-surface-2 p-2 ring-1 ring-border"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
                          <span className="min-w-0 truncate text-sm">
                            {f.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(f.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(i)}
                          className="h-8 px-2 text-foreground hover:bg-muted"
                          aria-label={`Remove file ${f.name}`}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what’s going on. The more details you share, the faster we can help."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={cn(
                  "mt-2 min-h-[140px] resize-y bg-surface-1",
                  errors.message && "ring-1 ring-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                required
              />
              <div className="mt-2 flex items-center justify-between">
                {errors.message ? (
                  <p id="message-error" className="text-xs text-destructive">
                    {errors.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We’ll route your ticket to the right team automatically.
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {message.length}/1000
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="human"
                checked={isHuman}
                onCheckedChange={(v) => setIsHuman(Boolean(v))}
                aria-invalid={!!errors.human}
                aria-describedby={errors.human ? "human-error" : undefined}
              />
              <div className="min-w-0">
                <Label htmlFor="human" className="cursor-pointer">
                  I’m not a robot
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Simple spam protection. No tracking, no captchas.
                </p>
                {errors.human && (
                  <p id="human-error" className="mt-1 text-xs text-destructive">
                    {errors.human}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                By submitting, you agree to be contacted about your request.
              </div>
              <Button
                type="submit"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
                disabled={loading}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {loading ? "Sending..." : "Send message"}
              </Button>
            </div>
          </form>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-6 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-border">
                    <MailCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Your request was submitted
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Ticket {success.ticketId} created. A confirmation email is on its way.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="p-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-1 rounded bg-primary"
                    aria-hidden="true"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: alternative contact and expectations */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-surface-1 p-4 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-medium">How we handle your request</h3>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  A ticket is created and routed to the correct team based on category.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <MailPlus className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  You receive an automatic confirmation email with your ticket ID.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <MailWarning className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  If no email arrives within a few minutes, check spam or reach out directly.
                </p>
              </li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg bg-surface-1 p-4 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <MailCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-medium">Other ways to reach us</h3>
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">Email</p>
                  <p className="truncate text-xs text-muted-foreground break-words">
                    support@eagle.vision
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-secondary text-secondary-foreground"
                  onClick={() => {
                    const addr = "support@eagle.vision";
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(addr).then(() => {
                        toast.success("Support email copied");
                      });
                    }
                  }}
                >
                  Copy
                </Button>
              </div>

              <Separator />

              <div>
                <p className="text-sm">Response time</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Most requests are answered within 24 hours (Mon–Fri). Urgent production issues receive priority handling.
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm">Support ticket API</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Programmatically open tickets via our API. Include context and logs for faster resolution.
                </p>
                <div className="mt-2 flex items-center gap-2 rounded-md bg-surface-2 p-2 ring-1 ring-border">
                  <code className="text-xs break-words">
                    POST /api/support/tickets
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-surface-1 p-4 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <FileInput className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-medium">Attachment tips</h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>Maximum 5 files, total under 10MB.</li>
              <li>Include screenshots or logs when reporting issues.</li>
              <li>Mask sensitive information before sharing.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}