"use client";

import React from "react";
import {
  FileChartLine,
  ListFilter,
  FunnelPlus,
  BookText,
  FileDigit,
  TabletSmartphone,
  ChartNoAxesCombined,
  ChartColumnStacked,
  SquareChartGantt,
  PanelsLeftBottom,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ReportType = "planner" | "investor" | "policymaker";
type ReportStatus = "ready" | "generating" | "queued" | "failed";

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  createdAt: string; // ISO date
  status: ReportStatus;
  progress?: number; // 0-100 when generating
  sizeMB?: number;
  summary: string;
  area?: string;
  templateId?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  icon: React.ReactNode;
}

export interface InsightsReportsProps {
  className?: string;
  style?: React.CSSProperties;
  initialReports?: Report[];
  onGenerateReport?: (template: ReportTemplate) => Promise<Report | void> | void;
  onDownload?: (report: Report, format: "pdf" | "csv") => Promise<void> | void;
  onShare?: (report: Report) => Promise<string | void> | string | void;
}

const defaultTemplates: ReportTemplate[] = [
  {
    id: "tpl-planner-1",
    name: "Urban Planner Snapshot",
    description: "Zoning, infrastructure capacity, and growth hotspots.",
    type: "planner",
    icon: <SquareChartGantt className="h-4 w-4 text-primary" aria-hidden="true" />,
  },
  {
    id: "tpl-investor-1",
    name: "Investor Opportunity",
    description: "ROI forecasts, risk profile, and market comparables.",
    type: "investor",
    icon: <ChartNoAxesCombined className="h-4 w-4 text-primary" aria-hidden="true" />,
  },
  {
    id: "tpl-policy-1",
    name: "Policy Impact Brief",
    description: "Compliance, environmental effects, and equity metrics.",
    type: "policymaker",
    icon: <PanelsLeftBottom className="h-4 w-4 text-primary" aria-hidden="true" />,
  },
];

const seededReports: Report[] = [
  {
    id: "rpt-001",
    title: "Downtown Transit-Oriented Development - Q3 Insight",
    type: "planner",
    createdAt: "2025-08-28T10:15:00Z",
    status: "ready",
    sizeMB: 7.3,
    summary:
      "Comprehensive TOD analysis with multimodal accessibility, population density shifts, and infrastructure readiness scores for proposed stations.",
    area: "Metro Core",
  },
  {
    id: "rpt-002",
    title: "Coastal Resilience Investment Scan",
    type: "investor",
    createdAt: "2025-08-30T08:42:00Z",
    status: "ready",
    sizeMB: 5.9,
    summary:
      "Top 12 sites with favorable risk-adjusted returns and insurance stress scenarios under RCP 4.5 and 8.5 models.",
    area: "Atlantic Coast",
  },
  {
    id: "rpt-003",
    title: "EV Charging Expansion - Policy Readiness",
    type: "policymaker",
    createdAt: "2025-09-02T13:08:00Z",
    status: "generating",
    progress: 62,
    sizeMB: 0.0,
    summary:
      "Policy compliance checks, grid capacity overlays, and equity access indices by census tract.",
    area: "Statewide",
  },
  {
    id: "rpt-004",
    title: "Industrial Corridor Heat Risk Mapping",
    type: "planner",
    createdAt: "2025-09-05T09:30:00Z",
    status: "queued",
    progress: 0,
    sizeMB: 0.0,
    summary:
      "Surface temperature anomalies, canopy deficit, and worker exposure estimates for mitigation planning.",
    area: "Sector 7 | North",
  },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadge(status: ReportStatus) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="secondary" className="bg-[var(--surface-2)] text-foreground border border-border">
          Ready
        </Badge>
      );
    case "generating":
      return (
        <Badge className="bg-[var(--surface-2)] text-[var(--warning)] border border-border">
          Generating
        </Badge>
      );
    case "queued":
      return (
        <Badge className="bg-[var(--surface-2)] text-muted-foreground border border-border">
          Queued
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-[var(--danger)]/10 text-[var(--danger)] border border-border">
          Failed
        </Badge>
      );
  }
}

export default function InsightsReports({
  className,
  style,
  initialReports,
  onGenerateReport,
  onDownload,
  onShare,
}: InsightsReportsProps) {
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<ReportType | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<ReportStatus | "all">("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "title">("newest");
  const [activeTab, setActiveTab] = React.useState<"all" | ReportType>("all");
  const [reports, setReports] = React.useState<Report[]>(initialReports ?? seededReports);
  const [viewing, setViewing] = React.useState<Report | null>(null);

  // Simulate generation progress for queued/generating reports
  React.useEffect(() => {
    const interval = setInterval(() => {
      setReports((prev) =>
        prev.map((r) => {
          if (r.status === "queued") {
            // Move queued to generating
            return { ...r, status: "generating", progress: 5 };
          }
          if (r.status === "generating") {
            const step = Math.random() * 12 + 5;
            const next = Math.min(100, (r.progress ?? 0) + step);
            if (next >= 100) {
              return {
                ...r,
                status: "ready",
                progress: 100,
                sizeMB: Number((Math.random() * 5 + 4).toFixed(1)),
              };
            }
            return { ...r, progress: next };
          }
          return r;
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const templates = defaultTemplates;

  const tabToType: Record<string, "all" | ReportType> = {
    all: "all",
    planner: "planner",
    investor: "investor",
    policymaker: "policymaker",
  };

  const filtered = React.useMemo(() => {
    const tabType = tabToType[activeTab] ?? "all";
    let list = [...reports];

    if (tabType !== "all") list = list.filter((r) => r.type === tabType);
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.summary?.toLowerCase().includes(q)) ||
          (r.area?.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "newest":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "oldest":
        list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return list;
  }, [reports, query, typeFilter, statusFilter, sortBy, activeTab]);

  function handleDownload(r: Report, fmt: "pdf" | "csv") {
    if (r.status !== "ready") {
      toast.info("Report is not ready to download yet.");
      return;
    }
    onDownload?.(r, fmt);
    toast.success(`Starting ${fmt.toUpperCase()} download for “${r.title}”.`);
  }

  async function handleShare(r: Report) {
    try {
      const link =
        (await onShare?.(r)) ||
        `${typeof window !== "undefined" ? window.location.origin : ""}/reports/${r.id}`;
      if (typeof window !== "undefined" && navigator?.clipboard) {
        await navigator.clipboard.writeText(link);
        toast.success("Share link copied to clipboard.");
      } else {
        toast.message("Share link", { description: link });
      }
    } catch {
      toast.error("Unable to create share link.");
    }
  }

  async function generateFromTemplate(tpl: ReportTemplate) {
    try {
      const maybe = await onGenerateReport?.(tpl);
      const newReport: Report =
        maybe || {
          id: `rpt-${Math.random().toString(36).slice(2, 8)}`,
          title: `${tpl.name} - Preview ${new Date().toLocaleDateString()}`,
          type: tpl.type,
          createdAt: new Date().toISOString(),
          status: "queued",
          progress: 0,
          sizeMB: 0,
          summary: tpl.description,
          area: "Selected Area",
          templateId: tpl.id,
        };
      setReports((prev) => [newReport, ...prev]);
      toast.success("Report queued for generation.");
    } catch {
      toast.error("Failed to queue report.");
    }
  }

  return (
    <div className={cn("w-full max-w-full space-y-5", className)} style={style}>
      {/* Header + Controls */}
      <div className="w-full rounded-xl bg-card border border-border p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileChartLine className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-semibold leading-tight truncate">
                  Insights & Reports
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Auto-generated analyses with full previews, downloads, and sharing.
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" className="shrink-0" aria-label="How reporting works">
                    <BookText className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">
                    Reports synthesize satellite imagery, model forecasts, and your saved areas.
                    Generation runs in the background; you&apos;ll see status updates here.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search reports by title, summary, or area"
                  className="w-full bg-[var(--surface-1)] border-border pr-10"
                  aria-label="Search reports"
                />
                <ListFilter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={(v) => setTypeFilter(v as any)} value={typeFilter}>
                <SelectTrigger className="w-[160px] bg-[var(--surface-1)]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="planner">Planner</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="policymaker">Policymaker</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(v) => setStatusFilter(v as any)} value={statusFilter}>
                <SelectTrigger className="w-[160px] bg-[var(--surface-1)]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(v) => setSortBy(v as any)} value={sortBy}>
                <SelectTrigger className="w-[150px] bg-[var(--surface-1)]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="default" className="gap-2">
                <FunnelPlus className="h-4 w-4" aria-hidden="true" />
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Report templates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => generateFromTemplate(tpl)}
              className="group rounded-lg border border-border bg-[var(--surface-1)] p-4 text-left transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label={`Generate ${tpl.name}`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-[var(--surface-2)] border border-border p-2">
                  {tpl.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{tpl.name}</p>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {tpl.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <TabletSmartphone className="h-3.5 w-3.5" aria-hidden="true" />
                      Optimized for all devices
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            Templates preconfigure analyses for each audience. You can customize the full report after generation.
          </p>
        </CardFooter>
      </Card>

      {/* Tabs for categories */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="bg-[var(--surface-1)]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="planner">Planners</TabsTrigger>
            <TabsTrigger value="investor">Investors</TabsTrigger>
            <TabsTrigger value="policymaker">Policymakers</TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <ReportGrid
            reports={filtered}
            onView={setViewing}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
        <TabsContent value="planner" className="mt-4">
          <ReportGrid
            reports={filtered}
            onView={setViewing}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
        <TabsContent value="investor" className="mt-4">
          <ReportGrid
            reports={filtered}
            onView={setViewing}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
        <TabsContent value="policymaker" className="mt-4">
          <ReportGrid
            reports={filtered}
            onView={setViewing}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
      </Tabs>

      {/* Explanation / Data sources */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">How are reports generated?</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="pipeline" className="border-border">
                <AccordionTrigger>Pipeline overview</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Data is ingested from satellite imagery, open geospatial datasets, and Eagle Vision models.
                  We process and score areas using standardized metrics, then assemble the report with charts,
                  maps, and narrative summaries tailored to the chosen template.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sources" className="border-border">
                <AccordionTrigger>Data sources</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  • Satellite: Sentinel-2, Landsat 8/9, commercial constellations where available.
                  • Demographics: official census datasets.
                  • Climate: CMIP models and regional downscaling.
                  • Infrastructure: OSM and curated utility feeds.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy" className="border-border">
                <AccordionTrigger>Privacy & reproducibility</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  We include data lineage and versioning in each report for auditability. Personal data is never included.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-border bg-[var(--surface-1)] p-4">
              <div className="flex items-center gap-2">
                <FileDigit className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="font-medium">Tips</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Use filters to narrow by audience or status. Generate from templates for a fast start,
                then open the full report to customize and export.
              </p>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border">CSV</Badge>
                <Badge variant="outline" className="border-border">PDF</Badge>
                <Badge variant="outline" className="border-border">Share</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full report dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-4xl bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{viewing?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {viewing?.summary}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Preview */}
              <div className="md:col-span-2 min-w-0">
                <div className="relative overflow-hidden rounded-lg border border-border bg-[var(--surface-1)]">
                  <img
                    src={`https://images.unsplash.com/photo-1496564203457-11bb1332aa06?q=80&w=1400&auto=format&fit=crop`}
                    alt="Report preview"
                    className="block w-full h-56 sm:h-72 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background/70 to-transparent">
                    <div className="flex items-center gap-2">
                      <ChartColumnStacked className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span className="text-xs text-muted-foreground truncate">
                        Preview visualization
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-[var(--surface-1)] p-3">
                  <p className="text-sm font-medium">Highlights</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <li className="break-words">• Area: {viewing.area || "N/A"}</li>
                    <li>• Created: {formatDate(viewing.createdAt)}</li>
                    <li>• Type: {viewing.type}</li>
                  </ul>
                </div>
              </div>

              {/* Meta & actions */}
              <div className="md:col-span-1 flex flex-col gap-3">
                <div className="rounded-lg border border-border bg-[var(--surface-1)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    {statusBadge(viewing.status)}
                  </div>
                  {(viewing.status === "generating" || viewing.status === "queued") && (
                    <div className="mt-3">
                      <Progress value={viewing.progress ?? 0} className="h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {viewing.status === "queued"
                          ? "In queue..."
                          : `Processing (${Math.floor(viewing.progress ?? 0)}%)`}
                      </p>
                    </div>
                  )}
                  {viewing.status === "ready" && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Size: {viewing.sizeMB?.toFixed(1)} MB
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-[var(--surface-1)] p-3">
                  <p className="text-sm font-medium">Export</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={viewing.status !== "ready"}
                      onClick={() => handleDownload(viewing, "pdf")}
                    >
                      <FileDigit className="mr-2 h-4 w-4" aria-hidden="true" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={viewing.status !== "ready"}
                      onClick={() => handleDownload(viewing, "csv")}
                    >
                      <FileDigit className="mr-2 h-4 w-4" aria-hidden="true" />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-[var(--surface-1)] p-3">
                  <p className="text-sm font-medium">Share</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a view-only link for collaborators.
                  </p>
                  <Button size="sm" className="mt-2 w-full" onClick={() => handleShare(viewing)}>
                    Share link
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Generated by Eagle Vision • Device-ready visualizations
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!viewing) return;
                  if (viewing.status !== "ready") {
                    toast.info("The report is still generating.");
                    return;
                  }
                  toast.success("Opening full report...");
                }}
              >
                Open full report
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportGrid({
  reports,
  onView,
  onDownload,
  onShare,
}: {
  reports: Report[];
  onView: (r: Report) => void;
  onDownload: (r: Report, fmt: "pdf" | "csv") => void;
  onShare: (r: Report) => void;
}) {
  if (!reports.length) {
    return (
      <div className="rounded-xl border border-border bg-[var(--surface-1)] p-10 text-center">
        <p className="text-sm text-muted-foreground">No reports match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {reports.map((r) => (
        <Card
          key={r.id}
          className="bg-card border border-border flex flex-col overflow-hidden"
        >
          <div className="relative">
            <img
              src={`https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=1200&auto=format&fit=crop`}
              alt=""
              className="block w-full h-32 object-cover"
            />
            <div className="absolute left-2 top-2">{statusBadge(r.status)}</div>
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base leading-tight truncate">{r.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(r.createdAt)} • {r.type}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More actions">
                    <ListFilter className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onShare(r)}>Share</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload(r, "pdf")}
                    disabled={r.status !== "ready"}
                  >
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDownload(r, "csv")}
                    disabled={r.status !== "ready"}
                  >
                    Download CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3">{r.summary}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border">
                  {r.area || "Unassigned"}
                </Badge>
                {r.status === "ready" && (
                  <span className="text-xs text-muted-foreground">{r.sizeMB?.toFixed(1)} MB</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {r.status === "generating" && `${Math.floor(r.progress ?? 0)}%`}
                {r.status === "queued" && "Queued"}
              </span>
            </div>

            {(r.status === "generating" || r.status === "queued") && (
              <div className="mt-3">
                <Progress value={r.progress ?? 0} className="h-1.5" />
              </div>
            )}
          </CardContent>

          <CardFooter className="mt-auto">
            <div className="flex w-full items-center gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onView(r)}
              >
                Preview
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (r.status !== "ready") {
                    toast.info("The report is still generating.");
                    return;
                  }
                  onView(r);
                }}
              >
                View full
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}