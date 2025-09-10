"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Satellite,
  ImageUpscale,
  ZoomIn,
  SatelliteDish,
  Monitor,
  Target,
  LassoSelect,
  ChartNoAxesCombined,
  TrendingUp,
  MousePointer2,
  SquareDashedMousePointer,
  ArrowUpDown,
  SquareSigma,
  ChartColumnBig,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SatelliteChangeDetectionProps = {
  className?: string
  style?: React.CSSProperties
  defaultLocation?: string
}

type Stats = {
  changedPercent: number
  majorAreas: { name: string; delta: number }[]
}

const BEFORE_IMG =
  "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=1600&auto=format&fit=crop"
const AFTER_IMG =
  "https://images.unsplash.com/photo-1509098681029-b45e9c845022?q=80&w=1600&auto=format&fit=crop"

export default function SatelliteChangeDetection({
  className,
  style,
  defaultLocation = "San Francisco, CA",
}: SatelliteChangeDetectionProps) {
  const [query, setQuery] = useState(defaultLocation)
  const [areaMode, setAreaMode] = useState<"point" | "box" | "lasso">("box")
  const [zoom, setZoom] = useState(10)
  const [resolution, setResolution] = useState(10) // meters per pixel
  const [compare, setCompare] = useState(50) // percentage for comparison slider
  const [showMask, setShowMask] = useState(true)
  const [showContours, setShowContours] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [model, setModel] = useState<string | undefined>(undefined)
  const [cloudMax, setCloudMax] = useState(20)
  const [stats, setStats] = useState<Stats>({
    changedPercent: 12.7,
    majorAreas: [
      { name: "Northwest Sector", delta: 6.1 },
      { name: "Harbor District", delta: 3.8 },
      { name: "Valley Edge", delta: 2.4 },
    ],
  })

  const isReady = !processing

  function handleAnalyze() {
    setProcessing(true)
    toast.message("Fetching Sentinel-2 imagery", {
      description: "Ensuring cloud-free scenes and preparing change model…",
    })
    setTimeout(() => {
      setProcessing(false)
      // Mock: recalc stats slightly to simulate update
      const jitter = (n: number) => Math.max(0, n + (Math.random() - 0.5) * 2)
      setStats((s) => ({
        changedPercent: parseFloat(jitter(s.changedPercent).toFixed(1)),
        majorAreas: s.majorAreas.map((a) => ({ ...a, delta: parseFloat(jitter(a.delta).toFixed(1)) })),
      }))
      toast.success("Analysis complete", {
        description: "Cloud-free before/after imagery and change overlay are ready.",
      })
    }, 1400)
  }

  function handleExport(type: "imagery" | "report") {
    const label = type === "imagery" ? "Imagery (GeoTIFF + PNG)" : "Analysis report (JSON + CSV)"
    toast.success(`Export started`, { description: `Preparing ${label} for ${query}…` })
    setTimeout(() => {
      toast.message("Export ready", {
        description: "Your download will begin shortly.",
      })
    }, 800)
  }

  const resolutionLabel = useMemo(() => `${resolution} m/px`, [resolution])
  const zoomLabel = useMemo(() => `Z${zoom}`, [zoom])

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-lg bg-card shadow-sm ring-1 ring-border",
        "text-foreground",
        className
      )}
      style={style}
      aria-label="Satellite change detection"
    >
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-border/70 bg-secondary text-secondary-foreground">
            <Satellite className="size-3.5" />
            Eagle Vision · Change Detection
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Controls */}
          <Card className="md:col-span-4 bg-secondary border-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <SatelliteDish className="size-5 text-primary" aria-hidden />
                Analysis Controls
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Search a place, fine-tune parameters, and run the model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="location">Location or coordinates</Label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 grow">
                    <Input
                      id="location"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., 37.7749, -122.4194 or city name"
                      className="bg-card focus-visible:ring-primary"
                      aria-label="Location search"
                      disabled={!isReady}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                      <Target className="size-4" />
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => toast.message("Selection mode", { description: "Click on the map to set AOI center." })}
                          disabled={!isReady}
                          aria-label="Pick on map"
                        >
                          <MousePointer2 className="mr-2 size-4" />
                          Pick
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Pick on map</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Area selection</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={areaMode === "point" ? "default" : "outline"}
                      onClick={() => setAreaMode("point")}
                      className="justify-center"
                      disabled={!isReady}
                    >
                      <Target className="mr-2 size-4" />
                      Point
                    </Button>
                    <Button
                      type="button"
                      variant={areaMode === "box" ? "default" : "outline"}
                      onClick={() => setAreaMode("box")}
                      className="justify-center"
                      disabled={!isReady}
                    >
                      <SquareDashedMousePointer className="mr-2 size-4" />
                      Box
                    </Button>
                    <Button
                      type="button"
                      variant={areaMode === "lasso" ? "default" : "outline"}
                      onClick={() => setAreaMode("lasso")}
                      className="justify-center"
                      disabled={!isReady}
                    >
                      <LassoSelect className="mr-2 size-4" />
                      Lasso
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={model}
                    onValueChange={setModel}
                    disabled={!isReady}
                  >
                    <SelectTrigger id="model" className="bg-card">
                      <SelectValue placeholder="Choose AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ev-s2-lite">EV-S2 Lite (fast)</SelectItem>
                      <SelectItem value="ev-s2-pro">EV-S2 Pro (balanced)</SelectItem>
                      <SelectItem value="ev-s1s2-fuse">EV S1/S2 Fusion (robust)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border/70" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zoom">Zoom level</Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ZoomIn className="size-3.5" />
                      {zoomLabel}
                    </span>
                  </div>
                  <Slider
                    id="zoom"
                    value={[zoom]}
                    min={6}
                    max={16}
                    step={1}
                    onValueChange={([v]) => setZoom(v)}
                    className="cursor-pointer"
                    disabled={!isReady}
                    aria-label="Zoom level"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resolution">Resolution</Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageUpscale className="size-3.5" />
                      {resolutionLabel}
                    </span>
                  </div>
                  <Slider
                    id="resolution"
                    value={[resolution]}
                    min={10}
                    max={60}
                    step={10}
                    onValueChange={([v]) => setResolution(v)}
                    className="cursor-pointer"
                    disabled={!isReady}
                    aria-label="Resolution"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cloud">Max cloud cover</Label>
                  <span className="text-xs text-muted-foreground">{cloudMax}%</span>
                </div>
                <Slider
                  id="cloud"
                  value={[cloudMax]}
                  min={0}
                  max={60}
                  step={5}
                  onValueChange={([v]) => setCloudMax(v)}
                  className="cursor-pointer"
                  disabled={!isReady}
                  aria-label="Max cloud cover"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <ChartNoAxesCombined className="size-4 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">Overlay: Change mask</div>
                    <div className="text-xs text-muted-foreground">Contours and heat map</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="mask" checked={showMask} onCheckedChange={setShowMask} disabled={!isReady} />
                    <Label htmlFor="mask" className="text-xs cursor-pointer">Mask</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="contours" checked={showContours} onCheckedChange={setShowContours} disabled={!isReady} />
                    <Label htmlFor="contours" className="text-xs cursor-pointer">Contours</Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={handleAnalyze} disabled={processing}>
                  <InspectionPanel className="mr-2 size-4" />
                  {processing ? "Processing…" : "Run analysis"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleExport("imagery")}
                  disabled={processing}
                >
                  <ArrowRightLeft className="mr-2 size-4" />
                  Export imagery
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleExport("report")}
                  disabled={processing}
                >
                  <SquareSigma className="mr-2 size-4" />
                  Export report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Viewer and Stats */}
          <div className="md:col-span-8 space-y-6 min-w-0">
            <Card className="overflow-hidden border-border bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Monitor className="size-5 text-primary" />
                  Before / After Comparison
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Cloud-free Sentinel-2 imagery with interactive reveal slider.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-secondary">
                  {/* BEFORE layer */}
                  <img
                    src={BEFORE_IMG}
                    alt="Before satellite scene"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ filter: "saturate(0.95)" }}
                  />
                  {/* AFTER clipped layer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      width: `${compare}%`,
                      overflow: "hidden",
                    }}
                    aria-hidden={!isReady}
                  >
                    <img
                      src={AFTER_IMG}
                      alt="After satellite scene"
                      className="h-full w-full object-cover"
                      style={{ filter: "saturate(1.05) contrast(1.05)" }}
                    />
                  </div>

                  {/* Change overlay mask */}
                  {showMask && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      aria-hidden
                      style={{
                        background:
                          "radial-gradient(1200px 600px at 20% 30%, rgba(46,211,183,0.12), transparent 60%), radial-gradient(1200px 600px at 80% 70%, rgba(239,90,122,0.12), transparent 60%)",
                        mixBlendMode: "screen",
                      }}
                    />
                  )}

                  {/* Contours */}
                  {showContours && (
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 56.25"
                      aria-hidden
                    >
                      <g stroke="rgba(240,178,137,0.6)" strokeWidth="0.2" fill="none">
                        <path d="M5 10 C20 5, 40 12, 55 9 S85 6, 95 12" />
                        <path d="M8 20 C22 16, 41 22, 56 19 S83 16, 92 23" />
                        <path d="M12 30 C26 26, 46 31, 61 28 S84 25, 90 33" />
                      </g>
                    </svg>
                  )}

                  {/* Divider handle */}
                  <div
                    className="absolute inset-y-0"
                    style={{ left: `calc(${compare}% - 1px)` }}
                    aria-hidden
                  >
                    <div className="h-full w-0.5 bg-primary/80 shadow-[0_0_0_1px_rgba(46,211,183,0.2)]" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-sm">
                        <ArrowUpDown className="size-3.5 text-primary" />
                        Drag
                      </div>
                    </div>
                  </div>

                  {/* Loading overlay */}
                  {processing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/40 border-t-primary" aria-label="Loading" />
                        <p className="text-sm text-muted-foreground">Processing satellite data…</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRightLeft className="size-4" />
                    <span className="hidden sm:inline">Reveal after image</span>
                    <span className="sm:hidden">Reveal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="compare" className="text-xs">Comparison</Label>
                    <input
                      id="compare"
                      type="range"
                      min={0}
                      max={100}
                      value={compare}
                      onChange={(e) => setCompare(parseInt(e.target.value))}
                      className="h-2 w-56 max-w-[60vw] cursor-ew-resize appearance-none rounded-full bg-secondary accent-[var(--color-primary)]"
                      aria-label="Comparison slider"
                      disabled={processing}
                    />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{compare}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3 bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <ChartColumnBig className="size-5 text-primary" />
                    Change Statistics
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Quantified pixel change and highlighted areas of interest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatTile
                      icon={<TrendingUp className="size-4 text-primary" />}
                      label="Pixels changed"
                      value={`${stats.changedPercent.toFixed(1)}%`}
                      helper=">= 0.2 Δ index"
                    />
                    <StatTile
                      icon={<SquareSigma className="size-4 text-primary" />}
                      label="Major areas"
                      value={`${stats.majorAreas.length}`}
                      helper="clusters > 1 km²"
                    />
                    <StatTile
                      icon={<ZoomIn className="size-4 text-primary" />}
                      label="Resolution"
                      value={`${resolution} m`}
                      helper={zoomLabel}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Top impacted areas</div>
                    <ul className="space-y-2">
                      {stats.majorAreas.map((a, i) => (
                        <li key={a.name} className="flex items-center justify-between rounded-md border border-border/60 bg-secondary px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm">{i + 1}. {a.name}</p>
                            <p className="text-xs text-muted-foreground">Δ area vs baseline</p>
                          </div>
                          <Badge className="bg-primary text-primary-foreground">{a.delta.toFixed(1)}%</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Satellite className="size-5 text-primary" />
                    Data & Settings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Model parameters and sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="params" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="params">Parameters</TabsTrigger>
                      <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>
                    <TabsContent value="params" className="space-y-4 pt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <KV label="Location" value={query} />
                        <KV label="Model" value={model ? model : "Not selected"} />
                        <KV label="Zoom" value={zoomLabel} />
                        <KV label="Resolution" value={resolutionLabel} />
                        <KV label="Cloud max" value={`${cloudMax}%`} />
                        <KV label="AOI" value={areaMode.toUpperCase()} />
                      </div>
                    </TabsContent>
                    <TabsContent value="sources" className="pt-3">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="s2">
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              <SatelliteDish className="size-4 text-primary" />
                              Sentinel-2 L2A
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Cloud-free mosaics generated within max {cloudMax}% cloud constraint. Bands used: B02, B03,
                            B04, B08. Preprocessing: atmospheric correction, cloud/shadow masking (SCL).
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="ev">
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              <ChartNoAxesCombined className="size-4 text-primary" />
                              Eagle Vision Models
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            Change model detects spectral index shifts and texture diffs with morphological cleanup.
                            Select EV-S2 Pro for balanced performance or Fusion for mixed S1/S2 robustness.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md border border-border/60 bg-card">
            {icon}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
      {helper && <div className="mt-1 text-[11px] text-muted-foreground">{helper}</div>}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary p-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm" title={value}>
        {value}
      </div>
    </div>
  )
}