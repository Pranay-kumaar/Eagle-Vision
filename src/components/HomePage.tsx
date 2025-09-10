"use client";

import * as React from "react";
import {
  Menu,
  WandSparkles,
  PanelTopDashed,
  LayoutTemplate,
  Navigation,
  MoveUpRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface HomePageProps {
  className?: string;
  onExploreMap?: () => void;
  onSatelliteAnalysis?: () => void;
  onNavigate?: (route: "home" | "map" | "analysis" | "query" | "docs") => void;
}

const features = [
  {
    title: "Natural querying",
    description:
      "Ask urban questions in plain language and get precise, map-anchored answers instantly.",
    icon: WandSparkles,
  },
  {
    title: "Change detection",
    description:
      "Track construction, land-use shifts, and vegetation changes from multi-temporal imagery.",
    icon: PanelTopDashed,
  },
  {
    title: "Multi-layer maps",
    description:
      "Combine satellite, zoning, and climate layers with intuitive controls and fast rendering.",
    icon: LayoutTemplate,
  },
  {
    title: "Risk analytics",
    description:
      "Assess flood, heat, and infrastructure risks with defensible, transparent methodologies.",
    icon: Navigation,
  },
];

function LogoMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      width="24"
      height="24"
      {...props}
    >
      <defs>
        <linearGradient id="ev-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-chart-4)" />
        </linearGradient>
      </defs>
      <path
        d="M6 16c5-9 15-9 20 0-5 9-15 9-20 0Z"
        fill="url(#ev-grad)"
        opacity="0.9"
      />
      <circle cx="16" cy="16" r="3" fill="var(--color-background)" />
      <circle cx="16" cy="16" r="1.5" fill="var(--color-primary)" />
    </svg>
  );
}

export default function HomePage({
  className,
  onExploreMap,
  onSatelliteAnalysis,
  onNavigate,
}: HomePageProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <section
      className={cn(
        "w-full max-w-full bg-background text-foreground",
        "relative",
        className
      )}
      aria-label="Eagle Vision landing"
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(46,211,183,0.15), transparent 70%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-border)] to-transparent" />
      </div>

      {/* Header */}
      <header className="container w-full">
        <div className="flex items-center justify-between gap-4 py-5">
          <button
            type="button"
            className="group inline-flex items-center gap-2 rounded-full bg-[--surface-1] px-3 py-2 ring-1 ring-inset ring-[--color-border] transition hover:ring-[--color-primary] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
            onClick={() => onNavigate?.("home")}
            aria-label="Eagle Vision, go to home"
          >
            <LogoMark className="shrink-0" />
            <span className="font-heading text-base font-semibold tracking-tight">
              Eagle Vision
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {[
              { label: "Map", route: "map" as const },
              { label: "Analysis", route: "analysis" as const },
              { label: "Query", route: "query" as const },
              { label: "Docs", route: "docs" as const },
            ].map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="text-sm text-foreground/90 hover:bg-[--surface-2]"
                onClick={() => onNavigate?.(item.route)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={onExploreMap}
            >
              Explore Map
              <MoveUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={cn(
            "md:hidden",
            "overflow-hidden transition-all duration-200",
            open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mb-2 rounded-lg bg-[--surface-1] p-2 ring-1 ring-inset ring-[--color-border]">
            {[
              { label: "Map", route: "map" as const },
              { label: "Analysis", route: "analysis" as const },
              { label: "Query", route: "query" as const },
              { label: "Docs", route: "docs" as const },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onNavigate?.(item.route);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground/90 hover:bg-[--surface-2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4 opacity-70" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container">
        <div className="relative isolate overflow-hidden rounded-2xl bg-[--surface-1] px-6 py-14 ring-1 ring-inset ring-[--color-border] sm:px-10 sm:py-16">
          {/* Subtle grid pattern */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "radial-gradient(ellipse at center, black 50%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 50%, transparent 100%)",
            }}
          />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[--color-border] bg-[--surface-2] px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[--color-primary]" />
              New: Satellite change detection now in beta
            </p>
            <h1 className="mt-5 font-heading text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">
              AI-powered urban intelligence for property and climate analytics
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Analyze cities at scale with natural language, multi-layer maps, and
              robust risk models built on satellite, climate, and cadastral data.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={onExploreMap}
                aria-label="Explore the interactive map"
              >
                Explore Map
                <MoveUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={onSatelliteAnalysis}
                aria-label="Open satellite analysis"
              >
                Satellite Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container">
        <div className="mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className={cn(
                "group relative h-full overflow-hidden rounded-xl border border-[--color-border] bg-card text-card-foreground",
                "transition-transform duration-300 hover:-translate-y-0.5"
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(400px 200px at 20% 0%, rgba(46,211,183,0.06), transparent 60%)",
                }}
              />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[--surface-2] ring-1 ring-inset ring-[--color-border] transition-colors group-hover:ring-[--color-primary]">
                  <f.icon className="h-5 w-5 text-[--color-primary]" aria-hidden="true" />
                </div>
                <CardTitle className="text-base sm:text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row">
          <Button
            variant="outline"
            className="w-full border-[--color-border] bg-[--surface-1] text-foreground hover:bg-[--surface-2] sm:w-auto"
            onClick={onExploreMap}
          >
            Get started on the map
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-foreground/90 hover:bg-[--surface-2] sm:w-auto"
            onClick={onNavigate ? () => onNavigate("docs") : undefined}
          >
            Read the docs
          </Button>
        </div>

        <div className="my-14 h-px w-full bg-[--color-border]" />
      </div>

      {/* Footer mini */}
      <footer className="container pb-10">
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-[--surface-1] px-4 py-4 ring-1 ring-inset ring-[--color-border] sm:flex-row sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <p className="truncate text-sm text-muted-foreground">
              Built for clarity and speed in urban intelligence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onExploreMap}>
              Launch Map
              <MoveUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}