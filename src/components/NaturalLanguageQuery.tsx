"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { SearchCheck, MessageCircleQuestionMark, Clock1, ChartSpline, SearchX, MousePointer2, Building2, Grid2x2X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

type QueryCategory = "urban-growth" | "traffic" | "risk" | "housing" | "environment" | "infrastructure"

type QueryRecord = {
  id: string
  text: string
  category?: QueryCategory
  timeframe?: string
  granularity?: string
  includeConfidence?: boolean
  createdAt: number
  status: "success" | "error"
  summary?: string
  results?: QueryResultItem[]
}

type QueryResultItem = {
  id: string
  title: string
  subtitle?: string
  metricLabel?: string
  metricValue?: string
  confidence?: number
  mapLink?: string
  details?: string
}

export interface NaturalLanguageQueryProps {
  className?: string
  initialCategory?: QueryCategory
  initialQuery?: string
}

const CATEGORIES: { key: QueryCategory; label: string }[] = [
  { key: "urban-growth", label: "Urban Growth" },
  { key: "traffic", label: "Traffic" },
  { key: "risk", label: "Risk" },
  { key: "housing", label: "Housing" },
  { key: "environment", label: "Environment" },
  { key: "infrastructure", label: "Infrastructure" },
]

const EXAMPLES: string[] = [
  "Which neighborhoods in Austin saw the fastest urban growth since 2020?",
  "Highlight areas at highest flood risk near Houston’s bayous",
  "Where did weekday congestion improve in Seattle over the last 6 months?",
  "Show zones with rising housing vacancy and declining rents in Detroit",
  "Identify heat island hotspots within 2km of schools in Phoenix",
  "Where are new building permits clustering in Miami this year?",
]

const SUGGESTION_SEED: string[] = [
  "urban expansion near transit hubs",
  "emerging retail corridors",
  "neighborhoods with decreasing foot traffic",
  "zones with rising construction density",
  "flood-prone blocks within FEMA zones",
  "blocks with new multi-family permits",
  "weekend congestion anomalies",
  "areas with frequent 311 complaints",
  "districts with rapid rent appreciation",
  "intersections with high incident rates",
]

function generateId(prefix = "q"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export default function NaturalLanguageQuery({
  className,
  initialCategory = "urban-growth",
  initialQuery = "",
}: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<QueryCategory>(initialCategory)
  const [timeframe, setTimeframe] = useState<string | undefined>(undefined)
  const [granularity, setGranularity] = useState<string | undefined>(undefined)
  const [includeConfidence, setIncludeConfidence] = useState(true)

  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"results" | "history" | "saved">("results")

  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<QueryResultItem[] | null>(null)
  const [history, setHistory] = useState<QueryRecord[]>([])
  const [saved, setSaved] = useState<QueryRecord[]>([])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const suggestionsRef = useRef<HTMLDivElement | null>(null)

  // Load persisted state
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const h = localStorage.getItem("ev_query_history")
      const s = localStorage.getItem("ev_saved_queries")
      if (h) setHistory(JSON.parse(h))
      if (s) setSaved(JSON.parse(s))
    } catch {
      // ignore
    }
  }, [])

  // Persist state
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("ev_query_history", JSON.stringify(history.slice(0, 50)))
    } catch {
      // ignore
    }
  }, [history])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("ev_saved_queries", JSON.stringify(saved.slice(0, 50)))
    } catch {
      // ignore
    }
  }, [saved])

  // Derived suggestions list
  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SUGGESTION_SEED.slice(0, 6)
    return SUGGESTION_SEED.filter((s) => s.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  // Close suggestions when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target as Node)
      ) {
        setSuggestionsOpen(false)
      }
    }
    if (typeof window !== "undefined") {
      document.addEventListener("click", onDocClick)
      return () => document.removeEventListener("click", onDocClick)
    }
  }, [])

  function handleSubmit() {
    const text = query.trim()
    if (!text) {
      toast.error("Please enter a question about urban trends or risks.")
      return
    }
    setIsLoading(true)
    setResults(null)
    setActiveTab("results")

    // Simulate AI processing; in production, call an API here
    const currentId = generateId()
    const startedAt = Date.now()

    setTimeout(() => {
      // Mock result set
      const ok = Math.random() > 0.06 // tiny chance of error
      if (!ok) {
        toast.error("The AI was unable to process your query. Try refining it.")
        const rec: QueryRecord = {
          id: currentId,
          text,
          category,
          timeframe,
          granularity,
          includeConfidence,
          createdAt: startedAt,
          status: "error",
          summary: "Processing error",
        }
        setHistory((h) => [rec, ...h])
        setIsLoading(false)
        return
      }

      const mock: QueryResultItem[] = Array.from({ length: 5 }).map((_, i) => {
        const conf = includeConfidence ? Math.round(75 + Math.random() * 24) : undefined
        return {
          id: generateId("res"),
          title: `Insight #${i + 1} • ${labelForCategory(category)}`,
          subtitle: sampleSubtitle(category, i),
          metricLabel: sampleMetricLabel(category),
          metricValue: sampleMetricValue(category),
          confidence: conf,
          mapLink: `/map?query=${encodeURIComponent(text)}&focus=${i}`,
          details:
            "This area exhibits notable change consistent with recent observations across similar districts. Click to view on the map interface.",
        }
      })

      const rec: QueryRecord = {
        id: currentId,
        text,
        category,
        timeframe,
        granularity,
        includeConfidence,
        createdAt: startedAt,
        status: "success",
        summary: summarize(text, category),
        results: mock,
      }

      setResults(mock)
      setHistory((h) => [rec, ...h])
      setIsLoading(false)
      toast.success("Results ready")
    }, 900 + Math.random() * 800)
  }

  function handleSaveCurrent() {
    const text = query.trim()
    if (!text) {
      toast.message("Type a query to save")
      return
    }
    const rec: QueryRecord = {
      id: generateId("save"),
      text,
      category,
      timeframe,
      granularity,
      includeConfidence,
      createdAt: Date.now(),
      status: "success",
    }
    setSaved((s) => [rec, ...s.filter((r) => r.text !== text)])
    toast.success("Query saved")
  }

  function rerun(record: QueryRecord) {
    setQuery(record.text)
    setCategory(record.category ?? "urban-growth")
    setTimeframe(record.timeframe)
    setGranularity(record.granularity)
    setIncludeConfidence(record.includeConfidence ?? true)
    setActiveTab("results")
    setTimeout(() => handleSubmit(), 50)
  }

  function exportJSON() {
    if (!results || results.length === 0) {
      toast.message("No results to export")
      return
    }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    triggerDownload(blob, "eagle-vision-results.json")
    toast.success("Exported JSON")
  }

  function exportCSV() {
    if (!results || results.length === 0) {
      toast.message("No results to export")
      return
    }
    const headers = ["id", "title", "subtitle", "metricLabel", "metricValue", "confidence", "mapLink", "details"]
    const lines = [headers.join(",")]
    results.forEach((r) => {
      const row = [
        r.id,
        r.title,
        r.subtitle ?? "",
        r.metricLabel ?? "",
        r.metricValue ?? "",
        r.confidence != null ? String(r.confidence) : "",
        r.mapLink ?? "",
        (r.details ?? "").replace(/[\r\n]+/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
      lines.push(row)
    })
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    triggerDownload(blob, "eagle-vision-results.csv")
    toast.success("Exported CSV")
  }

  function triggerDownload(blob: Blob, filename: string) {
    if (typeof window === "undefined") return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const hasResults = !!results && results.length > 0

  return (
    <section className={cn("w-full max-w-full rounded-lg bg-card border border-border", className)}>
      <Card className="bg-card border-none">
        <CardHeader className="gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl tracking-tight">
                Natural Language Query
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ask questions about urban trends and risks. Get AI-structured insights with direct links to the map.
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    aria-label="Export results"
                    disabled={!hasResults}
                  >
                    <Grid2x2X className="mr-2 h-4 w-4" aria-hidden />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                  <DropdownMenuLabel>Export Results</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportJSON}>Download JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportCSV}>Download CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Category and Refinements */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-muted-foreground">Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    variant={category === c.key ? "default" : "secondary"}
                    className={cn(
                      "h-8 rounded-full",
                      category === c.key
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    aria-pressed={category === c.key}
                    aria-label={`Select category ${c.label}`}
                  >
                    {c.key === "urban-growth" ? <Building2 className="mr-2 h-3.5 w-3.5" /> : null}
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Label htmlFor="timeframe" className="text-xs text-muted-foreground min-w-[84px]">
                  Timeframe
                </Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe" className="bg-secondary border-input text-foreground">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="1y">Last 1 year</SelectItem>
                    <SelectItem value="3y">Last 3 years</SelectItem>
                    <SelectItem value="5y">Last 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Label htmlFor="granularity" className="text-xs text-muted-foreground min-w-[84px]">
                  Granularity
                </Label>
                <Select value={granularity} onValueChange={setGranularity}>
                  <SelectTrigger id="granularity" className="bg-secondary border-input text-foreground">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="neighborhood">Neighborhood</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="confidence"
                    checked={includeConfidence}
                    onCheckedChange={setIncludeConfidence}
                    aria-label="Toggle confidence scoring"
                  />
                  <Label htmlFor="confidence" className="text-sm">
                    Include confidence
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="ml-auto sm:ml-0"
                  onClick={handleSaveCurrent}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Query Input */}
          <div className="relative" ref={suggestionsRef}>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSuggestionsOpen(true)
                  }}
                  onFocus={() => {
                    if (filteredSuggestions.length > 0) setSuggestionsOpen(true)
                  }}
                  placeholder="Ask about urban trends, risks, or changes…"
                  aria-label="Natural language query input"
                  className="w-full h-12 text-base sm:text-lg bg-secondary border-input focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/70"
                />
                {/* Suggestions list */}
                {suggestionsOpen && filteredSuggestions.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="Query suggestions"
                    className="absolute z-20 mt-2 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
                  >
                    {filteredSuggestions.map((s, i) => (
                      <button
                        key={`${s}-${i}`}
                        role="option"
                        aria-selected={false}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuery(s)
                          setSuggestionsOpen(false)
                          inputRef.current?.focus()
                        }}
                        className="group w-full text-left px-3 py-2 hover:bg-secondary/60 focus:bg-secondary/60 focus:outline-none flex items-center gap-2"
                      >
                        <MousePointer2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                        <span className="text-sm sm:text-[15px] truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="h-12 px-5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" aria-hidden />
                    Running…
                  </span>
                ) : (
                  <>
                    <SearchCheck className="mr-2 h-4 w-4" aria-hidden />
                    Ask
                  </>
                )}
              </Button>
            </div>
            {/* Example queries */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircleQuestionMark className="h-3.5 w-3.5" aria-hidden />
                Try:
              </span>
              {EXAMPLES.slice(0, 4).map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(ex)
                    setSuggestionsOpen(false)
                  }}
                  className="rounded-full px-3 py-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Results / History / Saved */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="bg-secondary text-secondary-foreground">
              <TabsTrigger value="results" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                <ChartSpline className="mr-2 h-4 w-4" aria-hidden />
                Results
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                <Clock1 className="mr-2 h-4 w-4" aria-hidden />
                History
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="mt-4">
              <ResultsPanel
                isLoading={isLoading}
                results={results}
                includeConfidence={includeConfidence}
                query={query}
                category={category}
              />
              {/* Mobile export button */}
              <div className="mt-4 sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      aria-label="Export results"
                      disabled={!hasResults}
                    >
                      <Grid2x2X className="mr-2 h-4 w-4" aria-hidden />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuLabel>Export Results</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exportJSON}>Download JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={exportCSV}>Download CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {history.length === 0 ? (
                <EmptyState
                  icon={<SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />}
                  title="No history yet"
                  body="Run a query and it will appear here for quick re-use."
                />
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {history.map((h) => (
                    <AccordionItem key={h.id} value={h.id} className="border-b border-border">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex w-full items-center gap-3 text-left">
                          <Badge
                            variant={h.status === "success" ? "default" : "destructive"}
                            className={cn(
                              "rounded-sm",
                              h.status === "success"
                                ? "bg-primary text-primary-foreground"
                                : "bg-destructive text-destructive-foreground"
                            )}
                          >
                            {h.status}
                          </Badge>
                          <p className="truncate font-medium">{h.text}</p>
                          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{labelForCategory(h.category ?? "urban-growth")}</span>
                            <span>•</span>
                            <time dateTime={new Date(h.createdAt).toISOString()}>
                              {new Date(h.createdAt).toLocaleString()}
                            </time>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-3">
                          {h.summary ? <p className="text-sm text-muted-foreground break-words">{h.summary}</p> : null}
                          <div className="flex flex-wrap gap-2">
                            {h.timeframe ? <Badge variant="outline">Timeframe: {labelForTimeframe(h.timeframe)}</Badge> : null}
                            {h.granularity ? <Badge variant="outline">Granularity: {labelForGranularity(h.granularity)}</Badge> : null}
                            <Badge variant="outline">Confidence: {h.includeConfidence ? "On" : "Off"}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => rerun(h)}>
                              Run again
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSaved((s) => [h, ...s])
                                toast.success("Saved to favorites")
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setHistory((all) => all.filter((x) => x.id !== h.id))
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                          {h.results && h.results.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {h.results.map((r) => (
                                <HistoryResultCard key={r.id} item={r} />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              {saved.length === 0 ? (
                <EmptyState
                  icon={<MessageCircleQuestionMark className="h-10 w-10 text-muted-foreground" aria-hidden />}
                  title="No saved queries"
                  body="Save queries you reuse frequently to access them quickly."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {saved.map((s) => (
                    <Card key={s.id} className="bg-surface-2 border border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{s.text}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                              {labelForCategory(s.category ?? "urban-growth")} •{" "}
                              <time dateTime={new Date(s.createdAt).toISOString()}>
                                {new Date(s.createdAt).toLocaleString()}
                              </time>
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            Saved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {s.timeframe ? <Badge variant="outline">Timeframe: {labelForTimeframe(s.timeframe)}</Badge> : null}
                          {s.granularity ? <Badge variant="outline">Granularity: {labelForGranularity(s.granularity)}</Badge> : null}
                          <Badge variant="outline">Confidence: {s.includeConfidence ? "On" : "Off"}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => rerun(s)}>
                            Run
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSaved((all) => all.filter((x) => x.id !== s.id))}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}

function ResultsPanel({
  isLoading,
  results,
  includeConfidence,
  query,
  category,
}: {
  isLoading: boolean
  results: QueryResultItem[] | null
  includeConfidence: boolean
  query: string
  category: QueryCategory
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-2/3 rounded-md bg-secondary animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
              <div className="h-5 w-3/4 rounded bg-secondary animate-pulse mb-2" />
              <div className="h-4 w-1/2 rounded bg-secondary animate-pulse mb-4" />
              <div className="h-10 w-full rounded bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />}
        title="No results yet"
        body="Ask a question to see structured insights with links back to the map."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">Results</h3>
        <Badge variant="outline" className="rounded-sm">
          {labelForCategory(category)}
        </Badge>
        <Badge variant="outline" className="rounded-sm">
          {truncate(query, 80)}
        </Badge>
        {includeConfidence ? <Badge variant="outline">Confidence on</Badge> : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {results.map((r) => (
          <Card key={r.id} className="bg-surface-1 border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.title}</CardTitle>
              {r.subtitle ? (
                <CardDescription className="text-xs text-muted-foreground break-words">{r.subtitle}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {r.metricLabel && r.metricValue ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">{r.metricLabel}</Badge>
                  <span className="text-sm font-medium">{r.metricValue}</span>
                </div>
              ) : null}
              {r.details ? <p className="text-sm text-muted-foreground">{r.details}</p> : null}
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={r.mapLink || "/map"}
                  className="inline-flex items-center text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 rounded-sm ring-offset-background"
                >
                  View on map
                </Link>
                {typeof r.confidence === "number" ? (
                  <span
                    aria-label={`Confidence ${r.confidence}%`}
                    className="text-xs text-muted-foreground"
                  >
                    {r.confidence}% confidence
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function HistoryResultCard({ item }: { item: QueryResultItem }) {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{item.title}</p>
        {typeof item.confidence === "number" ? (
          <Badge variant="outline" className="shrink-0">
            {item.confidence}% conf
          </Badge>
        ) : null}
      </div>
      {item.subtitle ? <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p> : null}
      <div className="mt-3 flex items-center justify-between">
        {item.metricLabel && item.metricValue ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{item.metricLabel}</Badge>
            <span className="text-sm font-medium">{item.metricValue}</span>
          </div>
        ) : <span />}
        <Link href={item.mapLink || "/map"} className="text-sm text-primary hover:underline">
          Open map
        </Link>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-surface-2 p-8">
      <div className="mb-3">{icon}</div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground max-w-prose">{body}</p>
    </div>
  )
}

function labelForCategory(key: QueryCategory): string {
  const found = CATEGORIES.find((c) => c.key === key)
  return found ? found.label : "Category"
}
function labelForTimeframe(v?: string) {
  switch (v) {
    case "6m":
      return "Last 6 months"
    case "1y":
      return "Last 1 year"
    case "3y":
      return "Last 3 years"
    case "5y":
      return "Last 5 years"
    default:
      return "Any"
  }
}
function labelForGranularity(v?: string) {
  switch (v) {
    case "block":
      return "Block"
    case "neighborhood":
      return "Neighborhood"
    case "district":
      return "District"
    case "city":
      return "City"
    default:
      return "Auto"
  }
}

function sampleSubtitle(category: QueryCategory, i: number) {
  const base: Record<QueryCategory, string[]> = {
    "urban-growth": [
      "New mid-rise permits near transit corridor",
      "Infill development along mixed-use spine",
      "Edge expansion into formerly industrial zone",
    ],
    traffic: [
      "AM peak smoothing post signal timing update",
      "Weekend congestion increase near venue",
      "Arterial queue length reduction by 12%",
    ],
    risk: [
      "Increased flood susceptibility along low-lying blocks",
      "Wildfire interface expansion into suburbs",
      "Storm surge exposure in coastal district",
    ],
    housing: [
      "Vacancy decline amid steady rent growth",
      "Permitting momentum for multi-family units",
      "Short-term rental saturation leveling",
    ],
    environment: [
      "Heat island intensification around paved lots",
      "Tree canopy loss near logistics hub",
      "Air quality variance along freeway edge",
    ],
    infrastructure: [
      "Utility upgrades clustered near downtown",
      "Transit stop accessibility improvements",
      "Bridge maintenance backlog trending down",
    ],
  }
  const arr = base[category]
  return arr[i % arr.length]
}

function sampleMetricLabel(category: QueryCategory) {
  switch (category) {
    case "traffic":
      return "Congestion Δ"
    case "risk":
      return "Risk Index"
    case "housing":
      return "Vacancy Rate"
    case "environment":
      return "Heat Anomaly"
    case "infrastructure":
      return "Project Count"
    default:
      return "Growth Score"
  }
}
function sampleMetricValue(category: QueryCategory) {
  switch (category) {
    case "traffic":
      return "-8.3%"
    case "risk":
      return "0.72"
    case "housing":
      return "4.9%"
    case "environment":
      return "+2.1°C"
    case "infrastructure":
      return "37"
    default:
      return "+18%"
  }
}

function summarize(text: string, category: QueryCategory): string {
  return `AI analyzed your query in ${labelForCategory(category)} and produced location-based insights with supporting metrics and confidence where available. Query: “${truncate(
    text,
    140
  )}”.`
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}