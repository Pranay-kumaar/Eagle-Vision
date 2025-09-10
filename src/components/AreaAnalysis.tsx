"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChartArea,
  ChartSpline,
  ChartNoAxesCombined,
  ZoomIn,
  InspectionPanel,
  TrendingUp,
  ChartColumnBig,
  ChartPie,
  Dot,
  SquareDashedTopSolid,
  SquareDivide,
  Columns3,
  SquareDashedMousePointer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Period = "1Y" | "3Y" | "5Y" | "10Y";
type Metric = "property_value" | "climate_risk" | "population";

type DownloadType = "pdf" | "csv";

export interface AreaAnalysisProps {
  areaName?: string;
  loading?: boolean;
  hasData?: boolean;
  initialPeriod?: Period;
  initialMetric?: Metric;
  className?: string;
  style?: React.CSSProperties;
  onFilterChange?: (filters: { period: Period; metric: Metric }) => void;
  onDownload?: (type: DownloadType) => Promise<void> | void;
}

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type Point = { x: number; y: number; t?: string; v?: number };

function useSyntheticSeries(period: Period, kind: "values" | "risk" | "yoy") {
  return React.useMemo<Point[]>(() => {
    const lengthMap: Record<Period, number> = { "1Y": 12, "3Y": 36, "5Y": 60, "10Y": 120 };
    const n = lengthMap[period];
    const pts: Point[] = [];
    const seedBase =
      kind === "values" ? 1.2 : kind === "risk" ? 0.6 : 0.9;
    for (let i = 0; i < n; i++) {
      const phase = i / n;
      const drift =
        kind === "values"
          ? 0.25 * phase
          : kind === "risk"
          ? -0.05 * phase
          : 0.0;
      const seasonal = Math.sin(phase * Math.PI * (period === "1Y" ? 2 : 4)) * (kind === "risk" ? 0.15 : 0.25);
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.03;
      const y = Math.max(0.05, seedBase + drift + seasonal + noise);
      const v =
        kind === "values"
          ? 350000 + (y - 0.9) * 240000
          : kind === "risk"
          ? Math.max(0, Math.min(100, 55 + (y - 0.6) * 120))
          : (seasonal + drift) * 100;
      pts.push({
        x: (i / (n - 1)) * 100,
        y: 100 - y * 80,
        t: `T${i + 1}`,
        v,
      });
    }
    return pts;
  }, [period, kind]);
}

function SparkArea({
  data,
  stroke = "var(--chart-1)",
  fill = "rgba(46, 211, 183, 0.12)",
  height = 140,
  ariaLabel,
}: {
  data: Point[];
  stroke?: string;
  fill?: string;
  height?: number;
  ariaLabel: string;
}) {
  const path = React.useMemo(() => {
    if (!data.length) return "";
    const d = data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ");
    return d;
  }, [data]);

  const area = React.useMemo(() => {
    if (!data.length) return "";
    const first = data[0];
    const last = data[data.length - 1];
    return `M ${first.x},100 L ${data.map((p) => `${p.x},${p.y}`).join(" L ")} L ${last.x},100 Z`;
  }, [data]);

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height={height}
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gradFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gradFill)" />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Bars({
  data,
  color = "var(--chart-2)",
  height = 140,
  ariaLabel,
}: {
  data: Point[];
  color?: string;
  height?: number;
  ariaLabel: string;
}) {
  const w = 100 / Math.max(1, data.length);
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height={height}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {data.map((p, i) => (
        <rect
          key={i}
          x={p.x - w * 0.45}
          y={p.y}
          width={w * 0.9}
          height={100 - p.y}
          fill={color}
          rx={0.8}
        />
      ))}
    </svg>
  );
}

function EmptyState({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return (
    <div className="w-full rounded-[var(--radius)] border border-dashed border-border bg-surface-1 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
        <SquareDashedTopSolid className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export default function AreaAnalysis({
  areaName = "Selected Area",
  loading = false,
  hasData = true,
  initialPeriod = "3Y",
  initialMetric = "property_value",
  className,
  style,
  onFilterChange,
  onDownload,
}: AreaAnalysisProps) {
  const [period, setPeriod] = React.useState<Period>(initialPeriod);
  const [metric, setMetric] = React.useState<Metric>(initialMetric);
  const [activeTab, setActiveTab] = React.useState("values");

  React.useEffect(() => {
    onFilterChange?.({ period, metric });
  }, [period, metric, onFilterChange]);

  const valuesSeries = useSyntheticSeries(period, "values");
  const riskSeries = useSyntheticSeries(period, "risk");
  const yoySeries = useSyntheticSeries(period, "yoy");

  const latestValue = valuesSeries.at(-1)?.v ?? 0;
  const prevValue = valuesSeries.at(-2)?.v ?? latestValue;
  const delta = latestValue - prevValue;
  const deltaPct = prevValue ? (delta / prevValue) * 100 : 0;

  const avgRisk = riskSeries.reduce((a, p) => a + (p.v ?? 0), 0) / Math.max(1, riskSeries.length);
  const riskBadgeTone =
    avgRisk >= 66 ? "bg-danger/20 text-danger" : avgRisk >= 33 ? "bg-warning/20 text-warning" : "bg-[color:var(--chart-3)]/20 text-[color:var(--chart-3)]";

  function handleDownload(type: DownloadType) {
    if (onDownload) {
      const res = onDownload(type);
      Promise.resolve(res)
        .then(() => toast.success(`Exported ${type.toUpperCase()} successfully`))
        .catch(() => toast.error(`Failed to export ${type.toUpperCase()}`));
      return;
    }
    toast.info(`Generating ${type.toUpperCase()}...`);
    setTimeout(() => toast.success(`${type.toUpperCase()} is ready`), 900);
  }

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-[var(--radius)] bg-card shadow-sm ring-1 ring-border",
        className
      )}
      style={style}
      aria-label="Area analysis"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <InspectionPanel className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="truncate font-heading text-lg font-semibold sm:text-xl">
                Area Analysis
              </h2>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              Focused insights for {areaName}. Explore property value trends, climate risk over time, and year-over-year changes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-surface-1"
                    aria-label="Zoom to area"
                  >
                    <ZoomIn className="mr-2 h-4 w-4" aria-hidden />
                    Focus
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom and center on the selected boundary</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:opacity-90">
                  <Columns3 className="mr-2 h-4 w-4" aria-hidden />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem] bg-popover">
                <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                  <SquareDivide className="mr-2 h-4 w-4" aria-hidden />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("csv")}>
                  <ChartColumnBig className="mr-2 h-4 w-4" aria-hidden />
                  Download CSV
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link href="/change-detection" className="flex w-full items-center">
                    <SquareDashedMousePointer className="mr-2 h-4 w-4" aria-hidden />
                    Change Detection
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="bg-surface-1">
            <CardContent className="flex items-center gap-3 p-3">
              <ChartNoAxesCombined className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Metric</p>
                <Select
                  value={metric}
                  onValueChange={(v: Metric) => setMetric(v)}
                >
                  <SelectTrigger className="h-9 w-full bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="property_value">Property Value</SelectItem>
                    <SelectItem value="climate_risk">Climate Risk</SelectItem>
                    <SelectItem value="population">Population</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-1">
            <CardContent className="flex items-center gap-3 p-3">
              <ChartArea className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Period</p>
                <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
                  <SelectTrigger className="h-9 w-full bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="1Y">1 Year</SelectItem>
                    <SelectItem value="3Y">3 Years</SelectItem>
                    <SelectItem value="5Y">5 Years</SelectItem>
                    <SelectItem value="10Y">10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-1">
            <CardContent className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[color:var(--chart-4)]/20 text-[color:var(--chart-4)]">Live</Badge>
                  <span className="truncate text-xs text-muted-foreground">Auto-refreshed</span>
                </div>
              </div>
              <Dot className="h-6 w-6 text-[color:var(--chart-4)]" aria-hidden />
            </CardContent>
          </Card>
        </div>

        {/* Map + Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="relative col-span-1 overflow-hidden rounded-[var(--radius)] border bg-surface-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Focused Map</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
                  Boundary highlight
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative min-h-[220px]">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[180px] w-full rounded-md bg-muted/40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-1/3 bg-muted/40" />
                    <Skeleton className="h-4 w-1/4 bg-muted/40" />
                  </div>
                </div>
              ) : hasData ? (
                <div className="relative h-[260px] w-full overflow-hidden rounded-md bg-[radial-gradient(120%_100%_at_0%_0%,rgba(46,211,183,0.08),rgba(20,25,23,0.2)),linear-gradient(to_bottom,var(--surface-2),var(--surface-1))]">
                  {/* Subtle grid */}
                  <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.18]">
                    <defs>
                      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  {/* Animated boundary */}
                  <svg className="absolute inset-0 h-full w-full" role="img" aria-label="Selected area boundary">
                    <g transform="translate(40,30)">
                      <path
                        d="M10,60 L50,10 L120,20 L160,70 L110,110 L40,100 Z"
                        fill="rgba(46,211,183,0.08)"
                        stroke="var(--chart-1)"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="0"
                          to="-12"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
                  </svg>
                  {/* Map overlay controls */}
                  <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="pointer-events-auto flex items-center gap-2 rounded-md bg-card/70 px-2 py-1.5 backdrop-blur">
                      <ChartPie className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-xs text-muted-foreground">Area: 24.1 km²</span>
                    </div>
                    <div className="pointer-events-auto flex items-center gap-2 rounded-md bg-card/70 px-2 py-1.5 backdrop-blur">
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-surface-2" aria-label="Zoom in">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No map data available"
                  description="We couldn't find any geospatial layers for this area. Try selecting a different region."
                  cta={
                    <Button asChild variant="outline" className="bg-surface-2">
                      <Link href="/change-detection">
                        <SquareDashedMousePointer className="mr-2 h-4 w-4" />
                        Explore Change Detection
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* KPI side */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-surface-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-2/3 bg-muted/40" />
                    <Skeleton className="h-4 w-1/2 bg-muted/40" />
                    <Skeleton className="h-4 w-1/3 bg-muted/40" />
                  </>
                ) : hasData ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Median Property Value</p>
                        <p className="truncate text-xl font-semibold">
                          ${Math.round(latestValue).toLocaleString()}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <TrendingUp className={cn("h-4 w-4", delta >= 0 ? "text-[color:var(--chart-3)]" : "text-destructive")} aria-hidden />
                          <span className={cn("text-xs", delta >= 0 ? "text-[color:var(--chart-3)]" : "text-destructive")}>
                            {delta >= 0 ? "+" : ""}
                            {deltaPct.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">vs prev</span>
                        </div>
                      </div>
                      <ChartSpline className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>

                    <Separator className="my-1" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Average Climate Risk</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-lg font-medium">{avgRisk.toFixed(1)}%</p>
                          <Badge className={cn("text-xs", riskBadgeTone)}>Risk</Badge>
                        </div>
                      </div>
                      <ChartPie className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>

                    <Separator className="my-1" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">YoY Change</p>
                        <p className="text-lg font-medium">
                          {((yoySeries.at(-1)?.v ?? 0) >= 0 ? "+" : "")}
                          {(yoySeries.at(-1)?.v ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <ChartColumnBig className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>
                  </>
                ) : (
                  <EmptyState title="No metrics" description="Metrics will appear once data is available for the selected area." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <Card className="bg-surface-1">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-base">Trends & Comparisons</CardTitle>
              <TabsList className="bg-card/60">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="hidden" />
                </Tabs>
              </TabsList>
              <div className="flex items-center gap-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-card/60">
                    <TabsTrigger value="values" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <ChartArea className="mr-2 h-4 w-4" aria-hidden />
                      Property Value
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <ChartNoAxesCombined className="mr-2 h-4 w-4" aria-hidden />
                      Climate Risk
                    </TabsTrigger>
                    <TabsTrigger value="yoy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <ChartColumnBig className="mr-2 h-4 w-4" aria-hidden />
                      YoY Comparison
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="values" className="m-0">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
                  <div className="col-span-2 p-4 md:p-6">
                    {loading ? (
                      <Skeleton className="h-[180px] w-full bg-muted/40" />
                    ) : hasData ? (
                      <SparkArea
                        data={valuesSeries}
                        ariaLabel="Property value trend"
                      />
                    ) : (
                      <EmptyState title="No data" description="Property value data unavailable for this timeframe." />
                    )}
                  </div>
                  <div className="border-t md:border-l md:border-t-0">
                    <div className="flex h-full flex-col justify-between p-4 md:p-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Latest Median</p>
                        <p className="text-xl font-semibold">
                          ${Math.round(latestValue).toLocaleString()}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <TrendingUp className={cn("h-4 w-4", delta >= 0 ? "text-[color:var(--chart-3)]" : "text-destructive")} aria-hidden />
                          <span className={cn("text-xs", delta >= 0 ? "text-[color:var(--chart-3)]" : "text-destructive")}>
                            {delta >= 0 ? "+" : ""}
                            {deltaPct.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">MoM</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Values adjusted for inflation where applicable. Use downloads to get raw series.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="m-0">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
                  <div className="col-span-2 p-4 md:p-6">
                    {loading ? (
                      <Skeleton className="h-[180px] w-full bg-muted/40" />
                    ) : hasData ? (
                      <SparkArea
                        data={riskSeries}
                        stroke="var(--chart-2)"
                        fill="rgba(240,178,137,0.12)"
                        ariaLabel="Climate risk over time"
                      />
                    ) : (
                      <EmptyState title="No data" description="Climate risk data unavailable for this timeframe." />
                    )}
                  </div>
                  <div className="border-t md:border-l md:border-t-0">
                    <div className="flex h-full flex-col justify-between p-4 md:p-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Average Risk</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xl font-semibold">{avgRisk.toFixed(1)}%</p>
                          <Badge className={cn("text-xs", riskBadgeTone)}>Risk</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Lower is better</p>
                      </div>
                      <div className="mt-6">
                        <p className="text-xs text-muted-foreground">Components</p>
                        <div className="mt-1 grid grid-cols-3 gap-2">
                          <span className="rounded bg-surface-2 px-2 py-1 text-center text-[10px] text-muted-foreground">Flood</span>
                          <span className="rounded bg-surface-2 px-2 py-1 text-center text-[10px] text-muted-foreground">Wildfire</span>
                          <span className="rounded bg-surface-2 px-2 py-1 text-center text-[10px] text-muted-foreground">Heat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="yoy" className="m-0">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
                  <div className="col-span-2 p-4 md:p-6">
                    {loading ? (
                      <Skeleton className="h-[180px] w-full bg-muted/40" />
                    ) : hasData ? (
                      <Bars data={yoySeries} ariaLabel="Year over year comparison" />
                    ) : (
                      <EmptyState title="No data" description="YoY comparison unavailable for this timeframe." />
                    )}
                  </div>
                  <div className="border-t md:border-l md:border-t-0">
                    <div className="flex h-full flex-col justify-between p-4 md:p-6">
                      <div>
                        <p className="text-xs text-muted-foreground">Current YoY</p>
                        <p className="text-xl font-semibold">
                          {((yoySeries.at(-1)?.v ?? 0) >= 0 ? "+" : "")}
                          {(yoySeries.at(-1)?.v ?? 0).toFixed(1)}%
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Relative to same period last year</p>
                      </div>
                      <div className="mt-6">
                        <p className="text-xs text-muted-foreground">Comparison</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--chart-2)]" />
                          <span className="text-xs text-muted-foreground">YoY bar height</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Related / Footer actions */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface-1 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-sm font-medium">Related Analysis</p>
            <p className="text-xs text-muted-foreground">
              Run satellite change detection and generate a consolidated report.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="bg-surface-2">
              <Link href="/change-detection">
                <SquareDashedMousePointer className="mr-2 h-4 w-4" />
                Change Detection
              </Link>
            </Button>
            <Button
              onClick={() => handleDownload("pdf")}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <SquareDivide className="mr-2 h-4 w-4" />
              Generate Report (PDF)
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}