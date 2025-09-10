"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ChartNoAxesCombined,
  ChartSpline,
  ChartBarStacked,
  TrendingUp,
  ChartPie,
  PanelTopDashed,
  Percent,
  Table as TableIcon,
  ChartColumnDecreasing,
  FileChartLine,
  Variable,
  SquareDivide,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Period = "7d" | "30d" | "90d" | "12m";
type PropertyClass = "residential" | "commercial" | "industrial" | "mixed";
type RiskType = "flood" | "fire" | "subsidence" | "crime";

type SeriesPoint = { x: string; y: number };
type Stat = {
  label: string;
  value: string;
  delta: number; // percent change
  helper?: string;
};

export type ModelResultsProps = {
  className?: string;
  style?: React.CSSProperties;
  initialPeriod?: Period;
  initialPropertyClass?: PropertyClass;
  initialRiskType?: RiskType;
  trendData?: SeriesPoint[];
  compareData?: { label: string; current: number; previous: number }[];
  insights?: string[];
  methodology?: string[];
  loading?: boolean;
};

const defaultTrend: SeriesPoint[] = [
  { x: "W1", y: 42 },
  { x: "W2", y: 48 },
  { x: "W3", y: 39 },
  { x: "W4", y: 54 },
  { x: "W5", y: 58 },
  { x: "W6", y: 47 },
  { x: "W7", y: 62 },
  { x: "W8", y: 66 },
];

const defaultCompare = [
  { label: "Low", current: 38, previous: 41 },
  { label: "Moderate", current: 27, previous: 25 },
  { label: "High", current: 19, previous: 17 },
  { label: "Severe", current: 16, previous: 17 },
];

const defaultInsights = [
  "Upward trend in high-risk indices across northern wards; rainfall anomaly correlates with 12% increase WoW.",
  "Commercial properties show lower sensitivity to short-term volatility vs. residential in mixed-use corridors.",
  "Emerging hotspots detected near Riverside wards with accelerated week-over-week risk elevation.",
];

const defaultMethodology = [
  "Models: Gradient-boosted trees and temporal transformers trained on historical incidents, satellite-derived features, and hydrological indices.",
  "Spatial aggregation: Results summarized at ward level using population-weighted averaging.",
  "Validation: 5-fold time-based cross-validation; AUC=0.87±0.02, RMSE reduced by 11% vs. baseline.",
  "Updates: Daily feature refresh; model retraining weekly or upon data drift detection.",
];

function toMonochromeHex(alpha = 1): string {
  // Using foreground with reduced opacity for strokes/fills
  return `rgba(233,238,236,${alpha})`;
}

export default function ModelResults({
  className,
  style,
  initialPeriod = "30d",
  initialPropertyClass = "residential",
  initialRiskType = "flood",
  trendData = defaultTrend,
  compareData = defaultCompare,
  insights = defaultInsights,
  methodology = defaultMethodology,
  loading: loadingProp,
}: ModelResultsProps) {
  const [period, setPeriod] = React.useState<Period>(initialPeriod);
  const [propertyClass, setPropertyClass] = React.useState<PropertyClass>(initialPropertyClass);
  const [riskType, setRiskType] = React.useState<RiskType>(initialRiskType);
  const [loading, setLoading] = React.useState<boolean>(!!loadingProp);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const [stats, setStats] = React.useState<Stat[]>([
    { label: "Avg Risk Index", value: "0.62", delta: 6.4, helper: "Model median across wards" },
    { label: "Affected Wards", value: "132", delta: 3.1, helper: ">= High threshold" },
    { label: "Incidents Forecast", value: "1,284", delta: -1.8, helper: "30d projection" },
    { label: "Signal Confidence", value: "92%", delta: 1.2, helper: "Validation-weighted" },
  ]);

  const lineSvgRef = React.useRef<SVGSVGElement | null>(null);
  const barSvgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (loadingProp !== undefined) setLoading(!!loadingProp);
  }, [loadingProp]);

  function simulateFetch() {
    setLoading(true);
    window.setTimeout(() => {
      // Simulate small variation to show refresh
      const jitter = (v: number) => Number((v + (Math.random() - 0.5) * 2).toFixed(1));
      setStats((prev) =>
        prev.map((s, i) =>
          i === 0
            ? { ...s, value: (Number(s.value) + (Math.random() - 0.5) * 0.06).toFixed(2), delta: jitter(s.delta) }
            : i === 2
            ? { ...s, value: `${Math.max(900, Number(s.value.replace(/,/g, "")) + Math.round((Math.random() - 0.5) * 60)).toLocaleString()}`, delta: jitter(s.delta) }
            : { ...s, delta: jitter(s.delta) }
        )
      );
      setLastUpdated(new Date());
      setLoading(false);
      toast.success("Model results refreshed");
    }, 900);
  }

  function handleRefresh() {
    if (typeof window === "undefined") return;
    simulateFetch();
  }

  function onExportCSV() {
    try {
      const rows: string[] = [];
      rows.push(["x", "trend_y"].join(","));
      trendData.forEach((p) => rows.push([p.x, String(p.y)].join(",")));
      rows.push("");
      rows.push(["label", "current", "previous"].join(","));
      compareData.forEach((c) => rows.push([c.label, String(c.current), String(c.previous)].join(",")));
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eagle-vision-model-results-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Data exported as CSV");
    } catch {
      toast.error("Failed to export CSV");
    }
  }

  async function svgToPng(svgEl: SVGSVGElement, name: string) {
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      const width = svgEl.viewBox.baseVal.width || svgEl.clientWidth || 800;
      const height = svgEl.viewBox.baseVal.height || svgEl.clientHeight || 400;
      const scale = 2; // crisp output
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      img.onload = () => {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-card").trim() || "#141917";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return toast.error("Failed to export PNG");
          const dl = document.createElement("a");
          dl.href = URL.createObjectURL(blob);
          dl.download = `${name}-${Date.now()}.png`;
          document.body.appendChild(dl);
          dl.click();
          dl.remove();
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Failed to render chart");
      };
      img.src = url;
    } catch {
      toast.error("Failed to export PNG");
    }
  }

  function onExportCharts() {
    if (typeof window === "undefined") return;
    let exported = 0;
    if (lineSvgRef.current) {
      svgToPng(lineSvgRef.current, "trend-line");
      exported++;
    }
    if (barSvgRef.current) {
      svgToPng(barSvgRef.current, "comparative-bars");
      exported++;
    }
    if (exported > 0) toast.success("Charts export started");
  }

  const monochromeStroke = "stroke-[color:var(--color-foreground)]/60";
  const monochromeFill = "fill-[color:var(--color-foreground)]/60";

  return (
    <section className={cn("w-full max-w-full", className)} style={style} aria-label="Model results and analytics">
      <Card className="bg-card border-border/60">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-heading tracking-tight flex items-center gap-2">
                <ChartNoAxesCombined className="size-5 text-primary" aria-hidden />
                AI Model Results
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Monochrome analytics of risk predictions across wards
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="bg-secondary/40 hover:bg-secondary text-foreground border-border"
                    >
                      <PanelTopDashed className="mr-2 size-4" aria-hidden />
                      Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Fetch latest model outputs</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="sm"
                onClick={onExportCharts}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FileChartLine className="mr-2 size-4" aria-hidden />
                Export charts
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExportCSV}
                className="bg-secondary/40 hover:bg-secondary text-foreground border-border"
              >
                <TableIcon className="mr-2 size-4" aria-hidden />
                Export data
              </Button>
            </div>
          </div>
          <Separator className="bg-border/60" />
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="period">Time period</Label>
              <Select
                onValueChange={(v: Period) => setPeriod(v)}
                value={period}
              >
                <SelectTrigger id="period" className="bg-secondary/40 border-border/70">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="property">Property class</Label>
              <Select
                onValueChange={(v: PropertyClass) => setPropertyClass(v)}
                value={propertyClass}
              >
                <SelectTrigger id="property" className="bg-secondary/40 border-border/70">
                  <SelectValue placeholder="Select property class" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed">Mixed-use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-1">
              <Label htmlFor="risk">Risk type</Label>
              <Select
                onValueChange={(v: RiskType) => setRiskType(v)}
                value={riskType}
              >
                <SelectTrigger id="risk" className="bg-secondary/40 border-border/70">
                  <SelectValue placeholder="Select risk type" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="subsidence">Subsidence</SelectItem>
                  <SelectItem value="crime">Crime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-xs text-muted-foreground">
                {lastUpdated ? (
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                ) : (
                  <span>Use filters and refresh to update</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="bg-secondary/40 border-border/60">
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-1/3 bg-muted/50" />
                    <Skeleton className="h-8 w-1/2 bg-muted/50" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-1/3 bg-muted/50" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat, idx) => {
                const DeltaIcon = stat.delta >= 0 ? TrendingUp : ChartColumnDecreasing;
                const deltaColor =
                  stat.delta >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]";
                return (
                  <Card key={stat.label} className="bg-secondary/40 border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                          {stat.label}
                        </CardDescription>
                        {idx === 0 ? (
                          <SquareDivide className="size-4 text-muted-foreground" aria-hidden />
                        ) : idx === 1 ? (
                          <Variable className="size-4 text-muted-foreground" aria-hidden />
                        ) : idx === 2 ? (
                          <ChartBarStacked className="size-4 text-muted-foreground" aria-hidden />
                        ) : (
                          <Percent className="size-4 text-muted-foreground" aria-hidden />
                        )}
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                        <div className={cn("flex items-center gap-1 text-sm", deltaColor)}>
                          <DeltaIcon className="size-4" aria-hidden />
                          <span className="font-medium">{Math.abs(stat.delta).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    {stat.helper ? (
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground">{stat.helper}</div>
                      </CardContent>
                    ) : null}
                  </Card>
                );
              })
            )}
          </div>

          {/* Charts + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-secondary/40 border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ChartSpline className="size-4 text-muted-foreground" aria-hidden />
                    <CardTitle className="text-base">Trend analysis</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {propertyClass} • {riskType} • {period}
                  </div>
                </div>
                <CardDescription className="text-muted-foreground">
                  Rolling risk index over time
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[220px]">
                {loading ? (
                  <Skeleton className="h-[200px] w-full bg-muted/50" />
                ) : (
                  <div className="relative w-full max-w-full overflow-hidden rounded-md bg-surface-1">
                    <svg
                      ref={lineSvgRef}
                      role="img"
                      aria-label="Trend line chart"
                      viewBox="0 0 640 240"
                      className="w-full h-auto"
                    >
                      <rect x="0" y="0" width="640" height="240" fill="var(--surface-1)" />
                      {/* Gridlines */}
                      {Array.from({ length: 5 }).map((_, i) => {
                        const y = 20 + (200 / 4) * i;
                        return (
                          <line
                            key={`g-${i}`}
                            x1="48"
                            y1={y}
                            x2="620"
                            y2={y}
                            className="stroke-[color:var(--color-muted-foreground)]/20"
                            strokeWidth="1"
                          />
                        );
                      })}
                      {/* Axes */}
                      <line x1="48" y1="20" x2="48" y2="220" stroke="rgba(233,238,236,0.35)" strokeWidth="1.5" />
                      <line x1="48" y1="220" x2="620" y2="220" stroke="rgba(233,238,236,0.35)" strokeWidth="1.5" />
                      {/* Labels */}
                      {trendData.map((p, i) => {
                        const x = 48 + (572 / Math.max(1, trendData.length - 1)) * i;
                        return (
                          <text
                            key={`lx-${i}`}
                            x={x}
                            y={234}
                            fontSize="10"
                            textAnchor="middle"
                            fill="rgba(138,149,144,0.9)"
                          >
                            {p.x}
                          </text>
                        );
                      })}
                      {/* Line + area */}
                      {(() => {
                        const ys = trendData.map((p) => p.y);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);
                        const scaleX = (i: number) => 48 + (572 / Math.max(1, trendData.length - 1)) * i;
                        const scaleY = (v: number) => 220 - ((v - minY) / Math.max(1, maxY - minY)) * 180 - 10; // padding
                        const path = trendData
                          .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p.y)}`)
                          .join(" ");
                        const area = `M 48 220 ${trendData
                          .map((p, i) => `L ${scaleX(i)} ${scaleY(p.y)}`)
                          .join(" ")} L 620 220 Z`;
                        return (
                          <>
                            <path d={area} fill="rgba(233,238,236,0.08)" />
                            <path
                              d={path}
                              fill="none"
                              stroke="rgba(233,238,236,0.78)"
                              strokeWidth="2.25"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            {trendData.map((p, i) => (
                              <circle
                                key={`pt-${i}`}
                                cx={scaleX(i)}
                                cy={scaleY(p.y)}
                                r="3"
                                fill="rgba(233,238,236,0.9)"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-secondary/40 border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ChartPie className="size-4 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-base">AI insights</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Model-generated interpretations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-4/5 bg-muted/50" />
                    <Skeleton className="h-3 w-5/6 bg-muted/50" />
                    <Skeleton className="h-3 w-3/4 bg-muted/50" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {insights.map((t, i) => (
                      <li
                        key={`ins-${i}`}
                        className="text-sm text-foreground/90 leading-relaxed"
                      >
                        • {t}
                      </li>
                    ))}
                  </ul>
                )}
                <Separator className="my-2 bg-border/60" />
                <p className="text-xs text-muted-foreground">
                  Insights are probabilistic. Validate with ground truth and local context before action.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparative Display */}
          <Card className="bg-secondary/40 border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartBarStacked className="size-4 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-base">Comparative distribution</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Current vs. previous period
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[180px] w-full bg-muted/50" />
              ) : (
                <div className="relative w-full max-w-full overflow-hidden rounded-md bg-surface-1">
                  <svg
                    ref={barSvgRef}
                    role="img"
                    aria-label="Comparative grouped bars"
                    viewBox="0 0 640 220"
                    className="w-full h-auto"
                  >
                    <rect x="0" y="0" width="640" height="220" fill="var(--surface-1)" />
                    <line x1="48" y1="20" x2="48" y2="190" stroke="rgba(233,238,236,0.35)" strokeWidth="1.5" />
                    <line x1="48" y1="190" x2="620" y2="190" stroke="rgba(233,238,236,0.35)" strokeWidth="1.5" />
                    {(() => {
                      const max = Math.max(...compareData.flatMap((d) => [d.current, d.previous, 1]));
                      const barW = 20;
                      const groupW = 80;
                      const baseX = 80;
                      return (
                        <>
                          {compareData.map((d, i) => {
                            const x0 = baseX + i * groupW;
                            const hPrev = (d.previous / max) * 150;
                            const hCurr = (d.current / max) * 150;
                            return (
                              <g key={`g-${d.label}`}>
                                <text
                                  x={x0 + barW}
                                  y={206}
                                  fontSize="10"
                                  textAnchor="middle"
                                  fill="rgba(138,149,144,0.9)"
                                >
                                  {d.label}
                                </text>
                                <rect
                                  x={x0}
                                  y={190 - hPrev}
                                  width={barW}
                                  height={hPrev}
                                  fill="rgba(233,238,236,0.28)"
                                />
                                <rect
                                  x={x0 + barW + 8}
                                  y={190 - hCurr}
                                  width={barW}
                                  height={hCurr}
                                  fill="rgba(233,238,236,0.75)"
                                />
                              </g>
                            );
                          })}
                          <text x="560" y="24" fontSize="10" fill="rgba(233,238,236,0.7)">Current</text>
                          <line x1="540" y1="20" x2="554" y2="20" stroke="rgba(233,238,236,0.75)" strokeWidth="6" />
                          <text x="560" y="40" fontSize="10" fill="rgba(233,238,236,0.7)">Previous</text>
                          <line x1="540" y1="36" x2="554" y2="36" stroke="rgba(233,238,236,0.28)" strokeWidth="6" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Trends / Table / Methodology */}
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="bg-secondary/40 border border-border/60">
              <TabsTrigger value="trends" className="data-[state=active]:bg-secondary">
                <TrendingUp className="mr-2 size-4" aria-hidden />
                Trends
              </TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-secondary">
                <TableIcon className="mr-2 size-4" aria-hidden />
                Data table
              </TabsTrigger>
              <TabsTrigger value="method" className="data-[state=active]:bg-secondary">
                <FileChartLine className="mr-2 size-4" aria-hidden />
                Methodology
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="mt-4">
              <Card className="bg-secondary/40 border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ChartSpline className="size-4 text-muted-foreground" aria-hidden />
                    <CardTitle className="text-base">Detailed trend</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Slope, volatility, and turning points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <Skeleton className="h-[140px] w-full bg-muted/50" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2 w-6 rounded-sm bg-foreground/80" />
                          Slope:{" "}
                          <span className="text-foreground">
                            {calcSlope(trendData).toFixed(2)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2 w-6 rounded-sm bg-foreground/40" />
                          Volatility:{" "}
                          <span className="text-foreground">
                            {calcVolatility(trendData).toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <div className="relative w-full overflow-hidden rounded-md bg-surface-1">
                        <MiniSpark data={trendData} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <Card className="bg-secondary/40 border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TableIcon className="size-4 text-muted-foreground" aria-hidden />
                    <CardTitle className="text-base">Ward-level snapshot</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Sample of predicted indices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full bg-muted/50" />
                      <Skeleton className="h-8 w-full bg-muted/50" />
                      <Skeleton className="h-8 w-full bg-muted/50" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                          <tr className="border-b border-border/60">
                            <th className="py-2 pr-4 font-medium">Ward</th>
                            <th className="py-2 pr-4 font-medium">Risk Index</th>
                            <th className="py-2 pr-4 font-medium">Change</th>
                            <th className="py-2 pr-4 font-medium">Class</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fakeRows.map((r) => (
                            <tr key={r.ward} className="border-b border-border/40">
                              <td className="py-2 pr-4">{r.ward}</td>
                              <td className="py-2 pr-4">{r.index.toFixed(2)}</td>
                              <td className={cn("py-2 pr-4", r.change >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]")}>
                                {r.change > 0 ? "+" : ""}
                                {r.change.toFixed(1)}%
                              </td>
                              <td className="py-2 pr-4">{r.class}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="method" className="mt-4">
              <Card className="bg-secondary/40 border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ChartNoAxesCombined className="size-4 text-muted-foreground" aria-hidden />
                    <CardTitle className="text-base">Data methodology</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    How results are generated and validated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-3/4 bg-muted/50" />
                      <Skeleton className="h-3 w-2/3 bg-muted/50" />
                      <Skeleton className="h-3 w-4/5 bg-muted/50" />
                    </div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90">
                      {methodology.map((m, i) => (
                        <li key={`m-${i}`} className="leading-relaxed">{m}</li>
                      ))}
                    </ul>
                  )}
                  <Separator className="bg-border/60" />
                  <p className="text-xs text-muted-foreground">
                    For detailed documentation and API usage, refer to the platform&apos;s technical guides.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function calcSlope(data: SeriesPoint[]): number {
  if (data.length < 2) return 0;
  // Simple slope using end - start normalized by count
  return (data[data.length - 1].y - data[0].y) / (data.length - 1);
}

function calcVolatility(data: SeriesPoint[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b.y, 0) / data.length;
  const variance = data.reduce((a, b) => a + Math.pow(b.y - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

function MiniSpark({ data }: { data: SeriesPoint[] }) {
  const width = 640;
  const height = 120;
  const paddingX = 8;
  const paddingY = 8;
  const xs = data.map((_, i) => paddingX + (i * (width - paddingX * 2)) / Math.max(1, data.length - 1));
  const ysVals = data.map((d) => d.y);
  const minY = Math.min(...ysVals);
  const maxY = Math.max(...ysVals);
  const scaleY = (v: number) =>
    height - paddingY - ((v - minY) / Math.max(1, maxY - minY)) * (height - paddingY * 2);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${scaleY(d.y)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <rect x="0" y="0" width={width} height={height} fill="var(--surface-2)" />
      {Array.from({ length: 3 }).map((_, i) => {
        const y = paddingY + ((height - paddingY * 2) / 2) * i;
        return (
          <line
            key={`gl-${i}`}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            className="stroke-[color:var(--color-muted-foreground)]/15"
            strokeWidth="1"
          />
        );
      })}
      <path d={path} fill="none" stroke="rgba(233,238,236,0.9)" strokeWidth="2" strokeLinecap="round" />
      {/* Last point marker */}
      {(() => {
        const i = data.length - 1;
        if (i < 0) return null;
        return (
          <circle
            cx={xs[i]}
            cy={scaleY(data[i].y)}
            r="3.5"
            fill="rgba(233,238,236,0.95)"
          />
        );
      })()}
    </svg>
  );
}

const fakeRows = [
  { ward: "Ward 12-North", index: 0.74, change: 4.2, class: "High" },
  { ward: "Ward 03-East", index: 0.61, change: -1.3, class: "Moderate" },
  { ward: "Ward 27-Central", index: 0.58, change: 0.7, class: "Moderate" },
  { ward: "Ward 09-Riverside", index: 0.83, change: 6.9, class: "Severe" },
  { ward: "Ward 18-West", index: 0.46, change: -2.1, class: "Low" },
];