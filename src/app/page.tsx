"use client";

import React, { useCallback, useMemo, useState } from "react";
import HomePage from "@/components/HomePage";
import InteractiveMap from "@/components/InteractiveMap";
import NaturalLanguageQuery from "@/components/NaturalLanguageQuery";
import AreaAnalysis from "@/components/AreaAnalysis";
import APIDocumentation from "@/components/APIDocumentation";
import InsightsReports from "@/components/InsightsReports";
import ModelResults from "@/components/ModelResults";
import UserGuideHelp from "@/components/UserGuideHelp";
import ContactFeedback from "@/components/ContactFeedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HelpCircle, Home, LineChart, Map, NotebookText, Satellite, PanelLeftOpen, PanelLeftClose } from "lucide-react";

type RouteKey = "home" | "map" | "analysis" | "query" | "docs" | "reports" | "support";

export default function Page() {
  const [route, setRoute] = useState<RouteKey>("home");
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Shared, cross-section state (simple demo values for cohesion)
  const [areaName] = useState<string>("San Francisco Bay Area");

  const navigate = useCallback((r: RouteKey) => setRoute(r), []);
  const goMap = useCallback(() => setRoute("map"), []);
  const goAnalysis = useCallback(() => setRoute("analysis"), []);

  const AppShellHeader = useMemo(() => {
    if (route === "home") return null; // HomePage has its own header
    const tabs: { key: RouteKey; label: string; icon: React.ReactNode }[] = [
      { key: "home", label: "Home", icon: <Home className="h-4 w-4" aria-hidden /> },
      { key: "map", label: "Map", icon: <Map className="h-4 w-4" aria-hidden /> },
      { key: "analysis", label: "Analysis", icon: <Satellite className="h-4 w-4" aria-hidden /> },
      { key: "query", label: "Query", icon: <NotebookText className="h-4 w-4" aria-hidden /> },
      { key: "docs", label: "API", icon: <NotebookText className="h-4 w-4" aria-hidden /> },
      { key: "reports", label: "Reports", icon: <LineChart className="h-4 w-4" aria-hidden /> },
      { key: "support", label: "Support", icon: <HelpCircle className="h-4 w-4" aria-hidden /> },
    ];
    return (
      <div className="sticky top-0 z-40 w-full border-b border-[--color-border] bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold hover:bg-[--surface-1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
            aria-label="Go to Eagle Vision Home"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[--color-primary]" />
            Eagle Vision
          </button>
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <Button
                key={t.key}
                variant={route === t.key ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "whitespace-nowrap",
                  route === t.key ? "bg-primary text-primary-foreground" : "text-foreground/80"
                )}
                onClick={() => navigate(t.key)}
                aria-current={route === t.key ? "page" : undefined}
              >
                {t.icon}
                <span className="ml-2">{t.label}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <Button
              variant={showHelp ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowHelp((s) => !s)}
              aria-pressed={showHelp}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>
      </div>
    );
  }, [navigate, route, showHelp, sidebarOpen]);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {AppShellHeader}

      {/* HOME */}
      {route === "home" ? (
        <div className="container mx-auto py-4 sm:py-6">
          <HomePage
            onExploreMap={goMap}
            onSatelliteAnalysis={goAnalysis}
            onNavigate={(r) => navigate(r as RouteKey)}
          />
        </div>
      ) : null}

      {/* APP SHELL FOR APP ROUTES */}
      {route !== "home" ? (
        <div className="container mx-auto py-4 sm:py-6">
          <div
            className={cn(
              "grid grid-cols-1 gap-4 lg:gap-6",
              // 2-column app layout with optional sidebar
              route === "map" || route === "analysis" || route === "query"
                ? "lg:grid-cols-[minmax(0,1fr)_360px]"
                : "lg:grid-cols-1"
            )}
          >
            {/* Primary pane */}
            <section className="min-w-0">
              {route === "map" ? (
                <div className="grid grid-rows-[auto_1fr_auto] gap-4">
                  <div className="rounded-xl border border-[--color-border] bg-[--surface-1] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Interactive Map</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate("analysis")}>
                          Open Analysis
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate("query")}>
                          Query
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[560px]">
                    <InteractiveMap className="h-[70vh] min-h-[560px]" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ModelResults />
                    <InsightsReports />
                  </div>
                </div>
              ) : null}

              {route === "analysis" ? (
                <div className="grid gap-4">
                  <AreaAnalysis areaName={areaName} />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ModelResults />
                    <InsightsReports />
                  </div>
                </div>
              ) : null}

              {route === "query" ? (
                <div className="grid gap-4">
                  <NaturalLanguageQuery />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <InsightsReports />
                    <ModelResults />
                  </div>
                </div>
              ) : null}

              {route === "docs" ? (
                <APIDocumentation className="w-full" />
              ) : null}

              {route === "reports" ? (
                <InsightsReports className="w-full" />
              ) : null}

              {route === "support" ? (
                <ContactFeedback className="w-full" />
              ) : null}
            </section>

            {/* Secondary sidebar pane (contextual) */}
            {(route === "map" || route === "analysis" || route === "query") && (
              <aside
                className={cn(
                  "hidden lg:block min-w-0 space-y-4 transition-all",
                  sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                aria-label="Contextual help and tools"
              >
                <UserGuideHelp />
              </aside>
            )}
          </div>
        </div>
      ) : null}

      {/* Floating help toggle on small screens */}
      {route !== "home" && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Button
            size="icon"
            className={cn("rounded-full", showHelp ? "bg-primary text-primary-foreground" : "")}
            onClick={() => setShowHelp((s) => !s)}
            aria-label="Toggle help panel"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Drawer-like overlay for help on small screens */}
      {showHelp && route !== "home" && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHelp(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl border border-[--color-border] bg-background p-3 shadow-2xl">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-[--color-border] mb-3" />
            <UserGuideHelp />
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setShowHelp(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* When on Home, we still offer quick help button */}
      {route === "home" && (
        <div className="container mx-auto pb-8">
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={() => setShowHelp(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Need a quick tour?
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}