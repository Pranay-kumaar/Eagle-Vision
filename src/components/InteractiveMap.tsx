"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { CircleDot, Locate, Map, MapPin, MapPlus, PanelsLeftBottom, PanelsRightBottom, Search, SearchSlash, SearchX, ZoomIn } from "lucide-react";

// Safely load react-leaflet only in the browser
// Types are loosely typed to avoid SSR import issues
type RL = typeof import("react-leaflet");
type LatLngTuple = [number, number];

const YEARS = { min: 2010, max: 2024 };

type LayerKey = "heatmap" | "climate" | "admin";

type Suggestion = {
  id: string;
  name: string;
  type: "city" | "neighborhood" | "address" | "region";
  center: LatLngTuple;
};

export interface InteractiveMapProps {
  className?: string;
  defaultCenter?: LatLngTuple;
  defaultZoom?: number;
  showInsights?: boolean;
}

export default function InteractiveMap({
  className,
  defaultCenter = [37.7749, -122.4194],
  defaultZoom = 11,
  showInsights = true,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rl, setRl] = useState<RL | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Map state
  const [zoom, setZoom] = useState(defaultZoom);
  const [year, setYear] = useState<number>(YEARS.max);
  const [isPlaying, setIsPlaying] = useState(false);

  // Layer toggles with loading states
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    heatmap: true,
    climate: false,
    admin: false,
  });
  const [layerLoading, setLayerLoading] = useState<Record<LayerKey, boolean>>({
    heatmap: true,
    climate: false,
    admin: false,
  });

  // Controls visibility (auto-hide)
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  // Side panel and dialogs
  const [panelOpen, setPanelOpen] = useState(showInsights);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Highlight pulse for selection
  const [pulse, setPulse] = useState(false);

  // Load react-leaflet on client
  useEffect(() => {
    let mounted = true;
    if (typeof window !== "undefined") {
      import("react-leaflet")
        .then((mod) => {
          if (mounted) setRl(mod);
        })
        .catch(() => {
          // fall back silently
        });
      // Load Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
      return () => {
        mounted = false;
      };
    }
  }, []);

  // Mock search dataset (could be replaced with API)
  const dataset: Suggestion[] = useMemo(
    () => [
      { id: "1", name: "San Francisco, CA", type: "city", center: [37.7749, -122.4194] },
      { id: "2", name: "Mission District", type: "neighborhood", center: [37.7599, -122.4148] },
      { id: "3", name: "Oakland, CA", type: "city", center: [37.8044, -122.2712] },
      { id: "4", name: "Berkeley, CA", type: "city", center: [37.8715, -122.2730] },
      { id: "5", name: "Golden Gate Park", type: "address", center: [37.7694, -122.4862] },
      { id: "6", name: "Marin County", type: "region", center: [38.0834, -122.7633] },
    ],
    []
  );

  // Debounced search
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    const t = window.setTimeout(() => {
      try {
        const q = query.toLowerCase();
        const res = dataset.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 5);
        setSuggestions(res);
        setSearchError(res.length ? null : "No results");
      } catch {
        setSearchError("Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, dataset]);

  // Auto-advance year animation
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setYear((y) => {
        if (y >= YEARS.max) return YEARS.min;
        return y + 1;
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  // Auto-hide controls after inactivity
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2500);
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = () => pokeControls();
    el.addEventListener("mousemove", onMove);
    el.addEventListener("touchstart", onMove);
    el.addEventListener("keydown", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("touchstart", onMove);
      el.removeEventListener("keydown", onMove);
    };
  }, [pokeControls]);

  // Layer toggle handler
  const toggleLayer = useCallback((key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
    setLayerLoading((prev) => ({ ...prev, [key]: true }));
    // Simulate async load
    window.setTimeout(() => {
      setLayerLoading((prev) => ({ ...prev, [key]: false }));
      toast.success(`${key === "heatmap" ? "Property heatmap" : key === "climate" ? "Climate risk" : "Administrative boundaries"} ${layers[key] ? "hidden" : "visible"}`, {
        duration: 1600,
      });
    }, 650);
  }, [layers]);

  // Map imperative helpers via refs once rl map is ready
  const mapRef = useRef<any>(null);

  const handleSelectSuggestion = (s: Suggestion) => {
    setSelectedPlace(s);
    setQuery(s.name);
    setSuggestions([]);
    setFocused(false);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 1800);

    // fly to selection
    if (mapRef.current && rl) {
      try {
        mapRef.current.flyTo(s.center, Math.max(12, zoom));
      } catch {
        // ignore
      }
    }
  };

  const handleLocate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        if (mapRef.current) {
          mapRef.current.flyTo(center, 13);
          setSelectedPlace({
            id: "me",
            name: "Your Location",
            type: "address",
            center,
          });
          setPulse(true);
          window.setTimeout(() => setPulse(false), 1600);
        }
      },
      () => toast("Unable to retrieve your location")
    );
  };

  // Export
  const doExport = (fmt: "png" | "geojson") => {
    toast.success(`Preparing ${fmt.toUpperCase()} export for year ${year}...`, { duration: 1600 });
    setExportOpen(false);
  };

  // Render
  const MapUI = rl ? (
    <rl.MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      whenCreated={(m: any) => {
        mapRef.current = m;
        setMapReady(true);
      }}
      className="w-full h-full rounded-lg outline-none"
      style={{ background: "var(--surface-1)" }}
      zoomControl={false}
      attributionControl={false}
    >
      <rl.TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // Keeping high contrast for dark UI
        opacity={0.9}
      />
      {layers.heatmap && !layerLoading.heatmap && (
        <rl.LayerGroup>
          {/* Simulated heatmap via translucent circles */}
          <rl.CircleMarker center={[37.78, -122.42]} radius={16} pathOptions={{ color: "transparent", fillColor: "var(--chart-1)", fillOpacity: 0.22 }} />
          <rl.CircleMarker center={[37.76, -122.45]} radius={20} pathOptions={{ color: "transparent", fillColor: "var(--chart-1)", fillOpacity: 0.18 }} />
          <rl.CircleMarker center={[37.80, -122.41]} radius={12} pathOptions={{ color: "transparent", fillColor: "var(--chart-1)", fillOpacity: 0.25 }} />
        </rl.LayerGroup>
      )}
      {layers.climate && !layerLoading.climate && (
        <rl.LayerGroup>
          {/* Simulated climate risk overlay */}
          <rl.CircleMarker center={[37.79, -122.39]} radius={22} pathOptions={{ color: "transparent", fillColor: "#f0b289", fillOpacity: 0.15 }} />
          <rl.CircleMarker center={[37.74, -122.46]} radius={26} pathOptions={{ color: "transparent", fillColor: "#ef4444", fillOpacity: 0.12 }} />
        </rl.LayerGroup>
      )}
      {layers.admin && !layerLoading.admin && (
        <rl.LayerGroup>
          {/* Simulated admin boundary nodes */}
          <rl.CircleMarker center={[37.77, -122.43]} radius={4} pathOptions={{ color: "var(--muted)", fillColor: "var(--muted)", weight: 1 }} />
          <rl.CircleMarker center={[37.77, -122.41]} radius={4} pathOptions={{ color: "var(--muted)", fillColor: "var(--muted)", weight: 1 }} />
          <rl.CircleMarker center={[37.79, -122.43]} radius={4} pathOptions={{ color: "var(--muted)", fillColor: "var(--muted)", weight: 1 }} />
        </rl.LayerGroup>
      )}
      {selectedPlace && (
        <rl.CircleMarker
          center={selectedPlace.center}
          radius={pulse ? 22 : 10}
          pathOptions={{
            color: "var(--primary)",
            weight: pulse ? 1 : 2,
            fillColor: "var(--primary)",
            fillOpacity: pulse ? 0.18 : 0.28,
          }}
        />
      )}
    </rl.MapContainer>
  ) : (
    <div className="w-full h-full rounded-lg bg-surface-1" />
  );

  const anyLayerLoading = layerLoading.heatmap || layerLoading.climate || layerLoading.admin;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full min-h-[560px] rounded-lg overflow-hidden bg-surface-1",
          "ring-1 ring-border",
          className
        )}
        onMouseMove={pokeControls}
        onTouchStart={pokeControls}
      >
        {/* Map */}
        <div className="absolute inset-0">
          {MapUI}
        </div>

        {/* Top bar: search + year slider */}
        <div
          className={cn(
            "pointer-events-none absolute left-4 right-4 top-4 z-[5] flex flex-col gap-3 sm:flex-row sm:items-center",
            "transition-opacity duration-300",
            controlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Search */}
          <div className="pointer-events-auto w-full sm:max-w-md">
            <div className={cn("relative group")}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Search places, neighborhoods, or queries..."
                className={cn(
                  "pl-9 pr-24 bg-surface-2/80 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70",
                  "border-border/60 text-foreground placeholder:text-muted-foreground",
                  "focus-visible:ring-1 focus-visible:ring-primary"
                )}
                aria-label="Search locations"
              />
              {/* Search actions */}
              <div className="absolute right-1.5 inset-y-1.5 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setSearchError(null);
                  }}
                >
                  {query ? <SearchX className="h-4 w-4" /> : <SearchSlash className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    if (suggestions[0]) handleSelectSuggestion(suggestions[0]);
                  }}
                >
                  <ZoomIn className="h-3.5 w-3.5 mr-1" />
                  Go
                </Button>
              </div>

              {/* Suggestions */}
              {(focused || query) && (searchLoading || suggestions.length || searchError) ? (
                <div
                  className={cn(
                    "absolute left-0 right-0 top-[110%] z-10 rounded-md border border-border/60",
                    "bg-surface-2/90 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70 shadow-lg"
                  )}
                  role="listbox"
                >
                  <div className="py-1">
                    {searchLoading ? (
                      <div className="px-3 py-2 flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ) : searchError ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <SearchSlash className="h-4 w-4" />
                        {searchError}
                      </div>
                    ) : (
                      suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={cn(
                            "w-full text-left px-3 py-2 hover:bg-secondary/50 focus:bg-secondary/50 focus:outline-none",
                            "flex items-center gap-2"
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectSuggestion(s)}
                          role="option"
                        >
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="truncate">{s.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{s.type}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Year slider */}
          <div className="pointer-events-auto flex-1 min-w-0">
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border border-border/60 px-3 py-2",
                "bg-surface-2/80 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70"
              )}
            >
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-8 w-8 shrink-0", isPlaying && "text-primary")}
                onClick={() => setIsPlaying((p) => !p)}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <span className="relative inline-block">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                    <CircleDot className="h-4 w-4" />
                  </span>
                ) : (
                  <CircleDot className="h-4 w-4" />
                )}
              </Button>
              <input
                type="range"
                min={YEARS.min}
                max={YEARS.max}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                aria-label="Timeline year"
                className={cn(
                  "w-full accent-primary",
                  "bg-transparent cursor-pointer"
                )}
              />
              <Badge variant="secondary" className="shrink-0 bg-secondary text-secondary-foreground">
                {year}
              </Badge>
            </div>
          </div>
        </div>

        {/* Left controls: layers */}
        <div
          className={cn(
            "pointer-events-none absolute left-4 bottom-4 z-[5] flex flex-col gap-2",
            "transition-all duration-300",
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
        >
          <div className="pointer-events-auto rounded-xl border border-border/60 bg-surface-2/80 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70 shadow-lg p-2">
            <div className="flex items-center gap-2 px-1 pb-2">
              <MapPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Layers</span>
            </div>

            <div className="space-y-2">
              {([
                { key: "heatmap", label: "Property heatmap", hint: "Visualize property density" },
                { key: "climate", label: "Climate risk", hint: "Overlay hazard exposure" },
                { key: "admin", label: "Admin boundaries", hint: "Show regional borders" },
              ] as { key: LayerKey; label: string; hint: string }[]).map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Label className="block text-sm">{l.label}</Label>
                    <span className="block text-xs text-muted-foreground">{l.hint}</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch
                          checked={layers[l.key]}
                          onCheckedChange={() => toggleLayer(l.key)}
                          aria-label={`Toggle ${l.label}`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-popover text-popover-foreground">
                      Toggle {l.label}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>

          {/* Map actions */}
          <div className="pointer-events-auto rounded-xl border border-border/60 bg-surface-2/80 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70 shadow-lg p-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={handleLocate}
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground">Locate me</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => setExportOpen(true)}
                  >
                    <PanelsRightBottom className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground">Export</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-9 w-9", panelOpen && "text-primary")}
                    onClick={() => setPanelOpen((v) => !v)}
                  >
                    <PanelsLeftBottom className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground">
                  {panelOpen ? "Hide insights" : "Show insights"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Loading indicator for layers */}
          {anyLayerLoading && (
            <div className="pointer-events-none rounded-md bg-surface-2/90 backdrop-blur px-2.5 py-1.5 text-xs text-muted-foreground border border-border/60 shadow">
              Loading layers...
            </div>
          )}
        </div>

        {/* Right controls: zoom */}
        <div
          className={cn(
            "pointer-events-none absolute right-4 bottom-4 z-[5] flex flex-col gap-2",
            "transition-all duration-300",
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
        >
          <div className="pointer-events-auto rounded-xl border border-border/60 bg-surface-2/80 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70 shadow-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => {
                    try {
                      if (mapRef.current) {
                        mapRef.current.zoomIn();
                        setZoom((z) => z + 1);
                      }
                    } catch {}
                  }}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground">Zoom in</TooltipContent>
            </Tooltip>
            <Separator />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => {
                    try {
                      if (mapRef.current) {
                        mapRef.current.zoomOut();
                        setZoom((z) => Math.max(0, z - 1));
                      }
                    } catch {}
                  }}
                >
                  <Map className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground">Zoom out</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Glass side panel */}
        <aside
          aria-label="AI insights"
          className={cn(
            "absolute right-4 top-20 bottom-4 z-[6] w-[calc(100%-2rem)] sm:w-[380px] max-w-[92vw] transition-all duration-300",
            panelOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"
          )}
        >
          <div className={cn(
            "h-full rounded-xl border border-border/60 shadow-2xl",
            "bg-surface-2/85 backdrop-blur supports-[backdrop-filter]:bg-surface-2/70",
            "flex flex-col overflow-hidden"
          )}>
            <div className="px-4 py-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {selectedPlace?.name ?? "Eagle Vision Insights"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {selectedPlace ? "AI summary for selected area" : "Explore the map to see insights"}
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-secondary/80">
                  {year}
                </Badge>
              </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Median Price" value={selectedPlace ? "$1.24M" : "$0.98M"} delta="+3.2%" tone="positive" />
                  <StatCard label="Listings" value={selectedPlace ? "2,184" : "5,402"} delta="-1.1%" tone="neutral" />
                  <StatCard label="Risk Index" value={layers.climate ? "0.62" : "0.48"} delta="+0.04" tone="warning" />
                </div>

                {/* Narrative */}
                <div className="rounded-lg border border-border/60 p-3 bg-surface-1/70">
                  <p className="text-sm leading-relaxed">
                    {selectedPlace ? (
                      <>
                        In {year}, {selectedPlace.name} shows moderate upward pricing momentum with pockets of strong demand near transit corridors. Climate risk overlay indicates elevated heat exposure in eastern tracts.
                      </>
                    ) : (
                      <>
                        Use the search to jump to a city or neighborhood. Toggle layers to reveal patterns across property density, climate exposure, and administrative boundaries.
                      </>
                    )}
                  </p>
                </div>

                {/* Layer statuses */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Layers</h4>
                  <div className="flex flex-wrap gap-2">
                    {(["heatmap", "climate", "admin"] as LayerKey[]).map((k) => (
                      <Badge
                        key={k}
                        variant="outline"
                        className={cn(
                          "border-border/70",
                          layers[k] ? "bg-primary/10 text-foreground" : "bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {k}
                        {layerLoading[k] && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setDetailOpen(true)}
                  >
                    Details
                  </Button>
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setExportOpen(true)}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Bottom attribution and status */}
        <div className="absolute left-4 right-4 bottom-2 z-[4] flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">Data layers are illustrative</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Map className="h-3 w-3" />
              OSM
            </span>
          </span>
        </div>

        {/* Details dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Area details</DialogTitle>
              <DialogDescription>AI-generated profile and key indicators for the selected area.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Name" value={selectedPlace?.name ?? "—"} />
                <InfoRow label="Year" value={String(year)} />
                <InfoRow label="Median Price" value={selectedPlace ? "$1.24M" : "$0.98M"} />
                <InfoRow label="YoY Change" value="+3.2%" />
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Narrative</h4>
                <p className="text-sm text-foreground/90">
                  Demand remains resilient with limited inventory. Climate exposure varies by micro-region; consider adaptation investments in at-risk zones.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setExportOpen(true)}>Export</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export dialog */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-md bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Export options</DialogTitle>
              <DialogDescription>Choose a format to export the current view and active layers.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 p-3 bg-surface-1/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">PNG image</div>
                    <div className="text-xs text-muted-foreground">High-res snapshot of the map and overlays</div>
                  </div>
                  <Button size="sm" onClick={() => doExport("png")}>Export</Button>
                </div>
              </div>
              <div className="rounded-md border border-border/60 p-3 bg-surface-1/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">GeoJSON</div>
                    <div className="text-xs text-muted-foreground">Export active vector layers as GeoJSON</div>
                  </div>
                  <Button size="sm" onClick={() => doExport("geojson")}>Export</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setExportOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "warning" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5 bg-surface-1/70">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
      {delta && (
        <div
          className={cn(
            "text-[11px] mt-0.5",
            tone === "positive" && "text-[var(--success)]",
            tone === "warning" && "text-[var(--warning)]",
            tone === "neutral" && "text-muted-foreground"
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}