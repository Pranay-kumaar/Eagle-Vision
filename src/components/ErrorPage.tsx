"use client";

import * as React from "react";
import { WifiOff, FolderX, OctagonX, MessageCircleWarning, ClipboardX, UndoDot } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type ErrorKind = "404" | "500" | "network" | "unknown";

export interface RecentPage {
  title: string;
  href: string;
}

export interface ErrorPageProps {
  code?: number | "404" | "500" | "network";
  title?: string;
  message?: string;
  errorId?: string;
  recent?: RecentPage[];
  onSearch?: (query: string) => void | Promise<void>;
  retry?: () => void | Promise<void>;
  supportEmail?: string;
  homepageHref?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ErrorPage({
  code,
  title,
  message,
  errorId,
  recent = [],
  onSearch,
  retry,
  supportEmail,
  homepageHref = "/",
  className,
  style,
}: ErrorPageProps) {
  const [query, setQuery] = React.useState("");
  const [retryLoading, setRetryLoading] = React.useState(false);

  const kind: ErrorKind = React.useMemo(() => {
    if (code === 404 || code === "404") return "404";
    if (code === 500 || code === "500") return "500";
    if (code === "network") return "network";
    return "unknown";
  }, [code]);

  const defaults = getDefaults(kind);

  const heading = title || defaults.title;
  const detail = message || defaults.message;

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      toast.message("Enter a search term", { description: "Try keywords like 'area analysis' or 'API docs'." });
      return;
    }
    try {
      if (onSearch) {
        await onSearch(q);
      } else {
        toast.info("Search not configured", { description: "Provide an onSearch prop to enable search." });
      }
    } catch (err) {
      toast.error("Search failed", { description: "Please try again." });
    }
  }

  async function handleRetry() {
    if (!retry) return;
    try {
      setRetryLoading(true);
      const res = retry();
      if (res instanceof Promise) {
        await res;
      }
      toast.success("Attempted to reload", { description: "If the issue persists, try again shortly." });
    } catch {
      toast.error("Retry failed", { description: "Please try again in a moment." });
    } finally {
      setRetryLoading(false);
    }
  }

  function handleCopyId() {
    if (!errorId) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(errorId).then(
        () => toast.success("Error ID copied"),
        () => toast.error("Copy failed")
      );
    } else {
      toast.info("Copy not available");
    }
  }

  const Icon = {
    "404": FolderX,
    "500": OctagonX,
    network: WifiOff,
    unknown: MessageCircleWarning,
  }[kind];

  const suggestions = getSuggestions(kind);

  return (
    <section
      aria-labelledby="error-heading"
      className={`w-full max-w-full ${className || ""}`}
      style={style}
    >
      <div className="w-full rounded-xl border bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-md">
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="shrink-0 rounded-lg bg-secondary text-primary ring-1 ring-border p-3 sm:p-4">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="error-heading" className="text-xl sm:text-2xl md:text-3xl font-heading tracking-tight">
                {heading}
              </h1>
              {code ? (
                <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border">
                  {String(code)}
                </span>
              ) : null}
              {errorId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={handleCopyId}
                >
                  <ClipboardX className="mr-2 h-4 w-4" aria-hidden="true" />
                  Copy error ID
                </Button>
              ) : null}
            </div>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground break-words">
              {detail}
            </p>

            <form onSubmit={handleSearch} className="mt-5 sm:mt-6 flex w-full gap-2">
              <label htmlFor="error-search" className="sr-only">
                Search
              </label>
              <Input
                id="error-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for pages, features, or help topics"
                className="bg-secondary/60 border-input text-foreground placeholder:text-muted-foreground/70"
                aria-label="Search site"
                autoComplete="off"
              />
              <Button type="submit" className="shrink-0">
                Search
              </Button>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ActionPrimary
                homepageHref={homepageHref}
                retry={retry}
                retryLoading={retryLoading}
                onRetry={handleRetry}
                supportEmail={supportEmail}
              />
              <SuggestionsList suggestions={suggestions} />
            </div>

            {recent && recent.length > 0 ? (
              <>
                <Separator className="my-6" />
                <div aria-labelledby="recent-pages-heading" className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 id="recent-pages-heading" className="text-sm font-semibold">
                      Recent pages
                    </h2>
                    <span className="text-xs text-muted-foreground">{Math.min(recent.length, 5)} shown</span>
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {recent.slice(0, 5).map((r, idx) => (
                      <li key={`${r.href}-${idx}`}>
                        {r.href ? (
                          <a
                            href={r.href}
                            className="group flex items-center gap-3 rounded-md border border-transparent hover:border-border hover:bg-secondary/60 px-3 py-2 transition-colors min-w-0"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/80 group-hover:bg-primary" aria-hidden="true" />
                            <span className="min-w-0 truncate">{r.title}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 rounded-md border px-3 py-2 bg-secondary/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                            <span className="min-w-0 truncate">{r.title}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function getDefaults(kind: ErrorKind): { title: string; message: string } {
  switch (kind) {
    case "404":
      return {
        title: "Page not found",
        message:
          "The page you’re looking for doesn’t exist or may have moved. Check the URL or try searching below.",
      };
    case "500":
      return {
        title: "Something went wrong",
        message:
          "An unexpected error occurred on our side. You can try again, or come back later while we fix this.",
      };
    case "network":
      return {
        title: "You appear to be offline",
        message:
          "We can’t reach Eagle Vision right now. Check your connection and try again.",
      };
    default:
      return {
        title: "We hit a snag",
        message:
          "An error occurred. Try the suggestions below or head back to the homepage.",
      };
  }
}

function getSuggestions(kind: ErrorKind): { title: string; desc: string }[] {
  switch (kind) {
    case "404":
      return [
        { title: "Check the URL", desc: "Typos and outdated bookmarks can cause this error." },
        { title: "Search the site", desc: "Find features like Area Analysis or API documentation." },
        { title: "Go back a page", desc: "Return to where you were and try a different path." },
      ];
    case "500":
      return [
        { title: "Try again", desc: "Temporary issues often resolve after a moment." },
        { title: "Check status", desc: "If outages persist, check your team’s status updates." },
        { title: "Contact support", desc: "Share steps to reproduce to help us fix it faster." },
      ];
    case "network":
      return [
        { title: "Check connection", desc: "Verify Wi‑Fi or cellular data are enabled." },
        { title: "Disable VPN/Proxy", desc: "Network tools can block access to services." },
        { title: "Reload when online", desc: "Once connected, reload this page to continue." },
      ];
    default:
      return [
        { title: "Reload the page", desc: "A fresh load can clear transient issues." },
        { title: "Try a different route", desc: "Use the homepage to navigate to your destination." },
        { title: "Report the issue", desc: "Include your browser and steps you took." },
      ];
  }
}

function SuggestionsList({ suggestions }: { suggestions: { title: string; desc: string }[] }) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <MessageCircleWarning className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Suggested actions</h3>
      </div>
      <ul className="grid gap-3">
        {suggestions.map((s, i) => (
          <li key={i} className="min-w-0">
            <div className="text-sm font-medium">{s.title}</div>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionPrimary({
  homepageHref,
  retry,
  retryLoading,
  onRetry,
  supportEmail,
}: {
  homepageHref: string;
  retry?: () => void | Promise<void>;
  retryLoading: boolean;
  onRetry: () => void | Promise<void>;
  supportEmail?: string;
}) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <UndoDot className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Quick actions</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={homepageHref} className="inline-flex">
          <Button className="w-full sm:w-auto">Back to Home</Button>
        </a>
        {retry ? (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onRetry}
            disabled={retryLoading}
          >
            {retryLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                Retrying…
              </span>
            ) : (
              "Try again"
            )}
          </Button>
        ) : null}
        {supportEmail ? (
          <a className="inline-flex" href={`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("Eagle Vision Support Request")}`}>
            <Button variant="outline" className="w-full sm:w-auto">Contact Support</Button>
          </a>
        ) : null}
      </div>
    </div>
  );
}