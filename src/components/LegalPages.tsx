"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollText,
  ShieldX,
  TextSearch,
  SquarePilcrow,
  Heading5,
  SeparatorHorizontal,
  ClipboardType,
  Copyright,
  PanelTopDashed,
  Scroll,
  Shredder,
} from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

type PolicySection = {
  id: string;
  title: string;
  category: string;
  content: string;
  callout?: {
    type: "info" | "warning" | "critical";
    title: string;
    body: string;
  };
};

type PolicyVersion = {
  version: string;
  date: string; // ISO date or human-readable
  notes?: string;
};

type PolicyData = {
  title: string;
  updatedAt: string; // ISO date
  pdfUrl?: string;
  sections: PolicySection[];
  versions: PolicyVersion[];
};

type LegalPagesProps = {
  className?: string;
  style?: React.CSSProperties;
  initialTab?: "terms" | "privacy";
  terms?: PolicyData;
  privacy?: PolicyData;
  onDownload?: (type: "terms" | "privacy") => void;
  onSectionNavigate?: (type: "terms" | "privacy", sectionId: string) => void;
};

const DEFAULT_TERMS: PolicyData = {
  title: "Terms of Use",
  updatedAt: "2025-06-01",
  pdfUrl: undefined,
  versions: [
    { version: "1.2.0", date: "2025-06-01", notes: "Clarified license terms and API usage limits." },
    { version: "1.1.0", date: "2025-03-10", notes: "Added arbitration clause and export control notice." },
    { version: "1.0.0", date: "2024-11-20", notes: "Initial release." },
  ],
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      category: "General",
      content:
        "By accessing or using Eagle Vision, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree, you must not use the service.",
      callout: {
        type: "info",
        title: "Summary",
        body:
          "Using Eagle Vision means you accept these terms. If not, please discontinue use immediately.",
      },
    },
    {
      id: "license",
      title: "License and Access",
      category: "Use of Service",
      content:
        "We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the services solely in accordance with these Terms and any applicable documentation.",
    },
    {
      id: "restrictions",
      title: "Prohibited Conduct",
      category: "Use of Service",
      content:
        "You may not misuse the service, attempt to gain unauthorized access, reverse engineer, or use automated means to extract data except as explicitly permitted by an applicable agreement.",
      callout: {
        type: "warning",
        title: "Important",
        body:
          "Automated scraping or data extraction without permission is prohibited and may result in account suspension.",
      },
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      category: "Legal",
      content:
        "To the maximum extent permitted by law, Eagle Vision and its affiliates shall not be liable for indirect, incidental, special, consequential, or exemplary damages arising from your use of the services.",
    },
    {
      id: "governing-law",
      title: "Governing Law",
      category: "Legal",
      content:
        "These Terms are governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to its conflict of laws principles.",
    },
  ],
};

const DEFAULT_PRIVACY: PolicyData = {
  title: "Privacy Policy",
  updatedAt: "2025-06-01",
  pdfUrl: undefined,
  versions: [
    { version: "2.1.0", date: "2025-06-01", notes: "Expanded data retention schedule and user rights section." },
    { version: "2.0.0", date: "2025-02-18", notes: "Added details on analytics and cookie preferences." },
    { version: "1.0.0", date: "2024-10-05", notes: "Initial release." },
  ],
  sections: [
    {
      id: "collection",
      title: "Information We Collect",
      category: "Data",
      content:
        "We collect account details, usage data, device information, and, where permitted, location data to operate and improve our services.",
      callout: {
        type: "info",
        title: "Examples",
        body:
          "Account email, login timestamps, feature usage events, and device/browser metadata.",
      },
    },
    {
      id: "use",
      title: "How We Use Information",
      category: "Data",
      content:
        "We use information to provide services, personalize experiences, maintain security, conduct analytics, and comply with legal obligations.",
    },
    {
      id: "sharing",
      title: "Sharing and Disclosure",
      category: "Data",
      content:
        "We do not sell personal information. We share data with service providers under contractual safeguards, or when required by law.",
    },
    {
      id: "retention",
      title: "Data Retention",
      category: "Data Governance",
      content:
        "We retain personal information only as long as necessary for the purposes outlined in this Policy, unless a longer retention is required by law.",
      callout: {
        type: "warning",
        title: "Retention Schedule",
        body:
          "Inactive accounts are typically purged after 24 months, subject to legal holds. You may request deletion earlier where applicable.",
      },
    },
    {
      id: "rights",
      title: "Your Rights",
      category: "Controls",
      content:
        "Depending on your location, you may have rights to access, correct, delete, or port your data, as well as object to or restrict processing.",
    },
  ],
};

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

type BookmarkKey = {
  policy: "terms" | "privacy";
  sectionId: string;
};

function storageKey(id: string) {
  return `eagle-legal-${id}`;
}

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return [text];
  try {
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${q})`, "ig");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="rounded-sm bg-primary/20 text-foreground ring-1 ring-primary/30 px-0.5"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  } catch {
    return [text];
  }
}

export default function LegalPages({
  className,
  style,
  initialTab = "terms",
  terms = DEFAULT_TERMS,
  privacy = DEFAULT_PRIVACY,
  onDownload,
  onSectionNavigate,
}: LegalPagesProps) {
  const ready = useClientReady();
  const [tab, setTab] = useState<"terms" | "privacy">(initialTab);
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkKey[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ready) return;
    try {
      const raw = localStorage.getItem(storageKey("bookmarks"));
      if (raw) {
        setBookmarks(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey("bookmarks"), JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks, ready]);

  const activePolicy = tab === "terms" ? terms : privacy;

  const categories = useMemo(() => {
    const map = new Map<string, PolicySection[]>();
    activePolicy.sections.forEach((s) => {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return Array.from(map.entries());
  }, [activePolicy]);

  const filteredSectionIds = useMemo(() => {
    if (!query.trim()) return new Set(activePolicy.sections.map((s) => s.id));
    const q = query.toLowerCase();
    const set = new Set<string>();
    activePolicy.sections.forEach((s) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        (s.callout &&
          (s.callout.title.toLowerCase().includes(q) ||
            s.callout.body.toLowerCase().includes(q)))
      ) {
        set.add(s.id);
      }
    });
    return set;
  }, [query, activePolicy]);

  const matchCount = filteredSectionIds.size;
  const totalCount = activePolicy.sections.length;

  const isBookmarked = (policy: "terms" | "privacy", sectionId: string) =>
    bookmarks.some((b) => b.policy === policy && b.sectionId === sectionId);

  const toggleBookmark = (policy: "terms" | "privacy", sectionId: string) => {
    setBookmarks((prev) => {
      const exists = prev.some(
        (b) => b.policy === policy && b.sectionId === sectionId
      );
      if (exists) {
        return prev.filter(
          (b) => !(b.policy === policy && b.sectionId === sectionId)
        );
      }
      return [...prev, { policy, sectionId }];
    });
  };

  const handleDownload = (type: "terms" | "privacy") => {
    if (onDownload) {
      onDownload(type);
      return;
    }
    const url = type === "terms" ? terms.pdfUrl : privacy.pdfUrl;
    if (url && typeof window !== "undefined") {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const scrollToSection = (id: string) => {
    const el = contentRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (onSectionNavigate) onSectionNavigate(tab, id);
  };

  return (
    <section
      className={classNames(
        "w-full max-w-full bg-surface-1 text-foreground rounded-lg border border-border",
        "shadow-sm",
        className
      )}
      style={style}
      aria-label="Legal policies"
    >
      <div className="w-full max-w-full px-4 sm:px-6 pt-5 pb-2 border-b border-border bg-surface-2/60 rounded-t-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scroll className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="truncate">Eagle Vision Legal</span>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-heading leading-tight">
                Legal Compliance
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownload("terms")}
                className="inline-flex items-center gap-2 rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-sm hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
                aria-label="Download Terms PDF"
              >
                <ScrollText className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Download Terms</span>
                <span className="sm:hidden">Terms</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload("privacy")}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 transition"
                aria-label="Download Privacy PDF"
              >
                <ShieldX className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Download Privacy</span>
                <span className="sm:hidden">Privacy</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Copyright className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">
                © {new Date().getFullYear()} Eagle Vision. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <PanelTopDashed className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="truncate">
                Last updated: {formatDate(activePolicy.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "terms" | "privacy")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full bg-secondary/60">
              <TabsTrigger value="terms" className="data-[state=active]:bg-surface-2">
                <ScrollText className="h-4 w-4 mr-2" aria-hidden="true" />
                Terms of Use
              </TabsTrigger>
              <TabsTrigger value="privacy" className="data-[state=active]:bg-surface-2">
                <ShieldX className="h-4 w-4 mr-2" aria-hidden="true" />
                Privacy Policy
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="policy-search" className="sr-only">
              Search within policy
            </label>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <TextSearch className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              id="policy-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search within policy..."
              className="w-full rounded-md bg-surface-2 text-foreground placeholder:text-muted-foreground/70 border border-border pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search within policy"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-3 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <SeparatorHorizontal className="h-4 w-4 rotate-90" aria-hidden="true" />
              </button>
            )}
          </div>
          <div
            className="text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing {matchCount} of {totalCount} sections
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {/* On this page navigation */}
        <nav
          className="w-full max-w-full bg-surface-2/60 rounded-md border border-border p-3 sm:p-4"
          aria-label="Section navigation"
        >
          <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Heading5 className="h-4 w-4" aria-hidden="true" />
            <span>On this page</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activePolicy.sections
              .filter((s) => filteredSectionIds.has(s.id))
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground px-2 py-1 text-xs hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
                >
                  <SquarePilcrow className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate max-w-[14ch] sm:max-w-[24ch]">{s.title}</span>
                </button>
              ))}
          </div>
        </nav>

        {/* Content and bookmarks panel */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div
            ref={contentRef}
            className="col-span-1 lg:col-span-8 w-full max-w-full min-w-0"
          >
            {categories.map(([category, sections]) => {
              const visible = sections.filter((s) => filteredSectionIds.has(s.id));
              if (visible.length === 0) return null;
              return (
                <div key={category} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardType className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="text-base sm:text-lg font-semibold">{category}</h2>
                  </div>
                  <div className="space-y-6">
                    {visible.map((section) => {
                      const bookmarked = isBookmarked(tab, section.id);
                      return (
                        <article
                          key={section.id}
                          id={section.id}
                          className="rounded-lg bg-surface-2 border border-border px-4 sm:px-5 py-4"
                          aria-labelledby={`${section.id}-title`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3
                                id={`${section.id}-title`}
                                className="text-lg sm:text-xl font-heading leading-snug"
                              >
                                {highlightText(section.title, query)}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Section ID: <span className="break-words">{section.id}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof window !== "undefined") {
                                    const url = new URL(window.location.href);
                                    url.hash = section.id;
                                    navigator.clipboard?.writeText(url.toString()).catch(() => {});
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground px-2.5 py-1.5 text-xs hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`Copy link to ${section.title}`}
                                title="Copy link"
                              >
                                <SquarePilcrow className="h-3.5 w-3.5" aria-hidden="true" />
                                Link
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleBookmark(tab, section.id)}
                                className={classNames(
                                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 transition",
                                  bookmarked
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/80"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-primary"
                                )}
                                aria-pressed={bookmarked}
                                aria-label={`${
                                  bookmarked ? "Remove" : "Add"
                                } bookmark for ${section.title}`}
                              >
                                {bookmarked ? (
                                  <Scroll className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                {bookmarked ? "Bookmarked" : "Bookmark"}
                              </button>
                            </div>
                          </div>

                          {section.callout && (
                            <div
                              className={classNames(
                                "mt-4 rounded-md border px-3.5 py-3 text-sm",
                                section.callout.type === "info" &&
                                  "bg-surface-1 border-border",
                                section.callout.type === "warning" &&
                                  "bg-surface-1 border-warning/40",
                                section.callout.type === "critical" &&
                                  "bg-surface-1 border-danger/40"
                              )}
                              role="note"
                              aria-label={`${section.callout.type} callout`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                {section.callout.type === "info" && (
                                  <PanelTopDashed
                                    className="h-4 w-4 text-primary"
                                    aria-hidden="true"
                                  />
                                )}
                                {section.callout.type === "warning" && (
                                  <Shredder
                                    className="h-4 w-4 text-warning"
                                    aria-hidden="true"
                                  />
                                )}
                                {section.callout.type === "critical" && (
                                  <ShieldX
                                    className="h-4 w-4 text-danger"
                                    aria-hidden="true"
                                  />
                                )}
                                <span className="font-medium">
                                  {highlightText(section.callout.title, query)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">
                                {highlightText(section.callout.body, query)}
                              </p>
                            </div>
                          )}

                          <div className="prose prose-invert max-w-none mt-4">
                            <p className="text-base sm:text-[1.05rem] leading-7 sm:leading-8 break-words">
                              {highlightText(section.content, query)}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side panel: bookmarks + version history */}
          <aside className="col-span-1 lg:col-span-4 w-full max-w-full min-w-0">
            <div className="rounded-lg bg-surface-2 border border-border p-4">
              <div className="flex items-center gap-2">
                <Scroll className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Bookmarks</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Quick access to sections you saved.
              </p>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                {bookmarks.filter((b) => b.policy === tab).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bookmarks yet. Use the Bookmark button on any section.
                  </p>
                ) : (
                  bookmarks
                    .filter((b) => b.policy === tab)
                    .map((b) => {
                      const s = activePolicy.sections.find((x) => x.id === b.sectionId);
                      if (!s) return null;
                      return (
                        <div
                          key={`${b.policy}-${b.sectionId}`}
                          className="flex items-center justify-between gap-2 rounded-md bg-surface-1 border border-border px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => scrollToSection(s.id)}
                            className="min-w-0 text-left"
                          >
                            <div className="text-sm font-medium truncate">{s.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {s.category} • #{s.id}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(tab, s.id)}
                            className="rounded-md px-2 py-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={`Remove bookmark ${s.title}`}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="rounded-lg bg-surface-2 border border-border p-4 mt-5">
              <div className="flex items-center gap-2">
                <ClipboardType className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Version history</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Track changes across policy releases.
              </p>

              <div className="mt-3 divide-y divide-border">
                {activePolicy.versions.map((v, idx) => (
                  <details
                    key={`${v.version}-${idx}`}
                    className="group open:bg-surface-1 rounded-md border border-border px-3 py-2 my-2"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          v{v.version} • {formatDate(v.date)}
                        </div>
                        {v.notes && (
                          <div className="text-xs text-muted-foreground truncate">
                            {v.notes}
                          </div>
                        )}
                      </div>
                      <SeparatorHorizontal
                        className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                    </summary>
                    {v.notes && (
                      <div className="mt-2 text-sm leading-relaxed text-foreground">
                        {v.notes}
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 rounded-md bg-surface-2 border border-border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              {tab === "terms" ? (
                <ScrollText className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <ShieldX className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <span className="font-semibold">{activePolicy.title}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Last updated {formatDate(activePolicy.updatedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(tab)}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 transition"
                aria-label={`Download ${activePolicy.title} as PDF`}
              >
                <Scroll className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}