"use client"

import React, { useMemo, useState } from "react"
import {
  MessageCircleQuestionMark,
  Info,
  CircleQuestionMark,
  MessageSquareCode,
  TextSearch,
  FileQuestionMark,
  LaptopMinimal,
  Contact,
  WifiLow,
  Speech,
  PhoneOutgoing,
  MailQuestionMark,
  NotebookTabs,
  PanelLeftClose,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

type HelpTopic = {
  id: string
  title: string
  category: "guides" | "faq" | "troubleshooting" | "glossary"
  summary?: string
  content: string
  tags: string[]
}

export interface UserGuideHelpProps {
  className?: string
  initialQuery?: string
  onTopicSelect?: (topicId: string) => void
}

const allTopics: HelpTopic[] = [
  {
    id: "guide-quickstart",
    title: "Quickstart: Explore Your First Area",
    category: "guides",
    summary: "Load the map, search a location, add layers, and generate insights.",
    content:
      "From the map, use the search bar to find a location. Toggle the layer panel to enable satellite imagery and boundaries. Click 'Analyze Area' to compute metrics and trends. Save a snapshot for later.",
    tags: ["quickstart", "map", "layers", "analysis"],
  },
  {
    id: "guide-change-detection",
    title: "Run a Change Detection",
    category: "guides",
    summary: "Compare satellite imagery across two dates to detect changes.",
    content:
      "Open Change Detection, pick a baseline and comparison date. Adjust sensitivity to refine the mask. Use the brush tools to exclude noise. Export results to the report.",
    tags: ["satellite", "change", "detection", "export"],
  },
  {
    id: "faq-billing",
    title: "How does billing work?",
    category: "faq",
    summary: "Credits are used for analyses; subscriptions include monthly credits.",
    content:
      "Eagle Vision uses a credit model. Each analysis consumes credits depending on data source and area. Subscriptions replenish credits monthly and unused credits roll over for one billing cycle.",
    tags: ["billing", "credits", "subscription"],
  },
  {
    id: "faq-accuracy",
    title: "What is the expected accuracy of analyses?",
    category: "faq",
    summary: "Accuracy varies by dataset resolution and cloud coverage.",
    content:
      "We combine multiple satellite providers and on-ground validations. Reported confidence intervals reflect the best-available data quality for your selected dates and AOI.",
    tags: ["accuracy", "data", "quality"],
  },
  {
    id: "ts-network",
    title: "Map tiles not loading",
    category: "troubleshooting",
    summary: "Check connectivity and firewall settings.",
    content:
      "If tiles fail to load: verify internet connectivity, disable VPN/proxy temporarily, and ensure ports 80/443 are open. Try clearing site data and reloading the page.",
    tags: ["network", "vpn", "tiles", "connectivity"],
  },
  {
    id: "ts-performance",
    title: "Slow analysis performance",
    category: "troubleshooting",
    summary: "Reduce area size or layer count to improve speed.",
    content:
      "Large AOIs or many layers can increase processing time. Start with a smaller AOI, reduce temporal range, and close unused panels. Consider upgrading your plan for higher concurrency.",
    tags: ["performance", "speed", "aoi", "layers"],
  },
  {
    id: "glossary-aoi",
    title: "AOI (Area of Interest)",
    category: "glossary",
    content:
      "A user-defined geographic area used as the target for analysis and reporting within Eagle Vision.",
    tags: ["glossary", "aoi"],
  },
  {
    id: "glossary-ndvi",
    title: "NDVI",
    category: "glossary",
    content:
      "Normalized Difference Vegetation Index, a measure of vegetation health derived from spectral bands.",
    tags: ["glossary", "ndvi", "vegetation"],
  },
]

function TopicIcon({ cat }: { cat: HelpTopic["category"] }) {
  const className = "h-4 w-4 shrink-0 text-muted-foreground"
  switch (cat) {
    case "guides":
      return <NotebookTabs className={className} aria-hidden="true" />
    case "faq":
      return <MessageCircleQuestionMark className={className} aria-hidden="true" />
    case "troubleshooting":
      return <WifiLow className={className} aria-hidden="true" />
    case "glossary":
      return <FileQuestionMark className={className} aria-hidden="true" />
    default:
      return <Info className={className} aria-hidden="true" />
  }
}

export default function UserGuideHelp({
  className,
  initialQuery = "",
  onTopicSelect,
}: UserGuideHelpProps) {
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<"guides" | "faq" | "troubleshooting" | "glossary" | "tutorials" | "contact">(
    "guides",
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allTopics
    return allTopics.filter((t) => {
      const hay = [t.title, t.summary, t.content, ...t.tags].join(" ").toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const grouped = useMemo(() => {
    return {
      guides: filtered.filter((t) => t.category === "guides"),
      faq: filtered.filter((t) => t.category === "faq"),
      troubleshooting: filtered.filter((t) => t.category === "troubleshooting"),
      glossary: filtered.filter((t) => t.category === "glossary"),
    }
  }, [filtered])

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-lg border bg-card text-card-foreground shadow-sm",
        "bg-[--surface-1]",
        className,
      )}
      aria-label="User help and guides"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <PanelLeftClose className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="truncate text-lg font-semibold sm:text-xl">Help & User Guide</h2>
            </div>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Contextual
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Search topics, follow step-by-step guides, or open quick answers. Optimized for the Eagle Vision map and analysis tools.
          </p>
        </header>

        <div className="relative">
          <TextSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="help-search" className="sr-only">
            Search help topics
          </label>
          <Input
            id="help-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help (e.g., change detection, NDVI, billing)"
            className={cn(
              "pl-9 bg-[--surface-2] border-border text-foreground placeholder:text-muted-foreground",
              "focus-visible:ring-1 focus-visible:ring-[--ring]",
            )}
            aria-label="Search help"
            autoComplete="off"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as typeof activeTab)
          }
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto rounded-md bg-secondary p-1">
            <TabsTrigger value="guides" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <NotebookTabs className="h-4 w-4" aria-hidden="true" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <MessageSquareCode className="h-4 w-4" aria-hidden="true" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <WifiLow className="h-4 w-4" aria-hidden="true" />
              Troubleshoot
            </TabsTrigger>
            <TabsTrigger value="glossary" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <FileQuestionMark className="h-4 w-4" aria-hidden="true" />
              Glossary
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <LaptopMinimal className="h-4 w-4" aria-hidden="true" />
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2 data-[state=active]:bg-[--surface-2]">
              <Contact className="h-4 w-4" aria-hidden="true" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader className="gap-2">
                <CardTitle className="text-base sm:text-lg">Step-by-step Guides</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Follow progressive steps to complete common workflows.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <GuideSteps onSelect={(id) => onTopicSelect?.(id)} />
                  <Separator className="bg-border" />
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Related Guides</h3>
                    <ScrollArea className="max-h-56 rounded-md border border-border">
                      <ul className="divide-y divide-border">
                        {(grouped.guides.length ? grouped.guides : allTopics.filter((t) => t.category === "guides")).map(
                          (t) => (
                            <li key={t.id} className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onTopicSelect?.(t.id)}
                                className={cn(
                                  "group flex w-full items-start gap-3 p-3 text-left transition",
                                  "hover:bg-[--surface-2] focus:outline-none focus-visible:ring-1 focus-visible:ring-[--ring]",
                                )}
                                aria-label={`Open guide ${t.title}`}
                              >
                                <TopicIcon cat="guides" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{t.title}</p>
                                  {t.summary ? (
                                    <p className="line-clamp-2 text-xs text-muted-foreground">{t.summary}</p>
                                  ) : null}
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {t.tags.slice(0, 3).map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="border-border bg-transparent text-muted-foreground"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ),
                        )}
                      </ul>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Frequently Asked Questions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Technical and contextual questions answered.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {(grouped.faq.length ? grouped.faq : allTopics.filter((t) => t.category === "faq")).map((t) => (
                    <AccordionItem key={t.id} value={t.id} className="border-border">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <MessageCircleQuestionMark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0 truncate">{t.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">{t.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Troubleshooting Guides</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Resolve common issues with clear checklists.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {(grouped.troubleshooting.length
                  ? grouped.troubleshooting
                  : allTopics.filter((t) => t.category === "troubleshooting")
                ).map((t) => (
                  <div key={t.id} className="rounded-md border border-border bg-[--surface-2] p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <WifiLow className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium">{t.title}</h4>
                        <p className="text-xs text-muted-foreground">{t.summary}</p>
                      </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`${t.id}-steps`} className="border-border">
                        <AccordionTrigger className="hover:no-underline text-sm">
                          Show steps
                        </AccordionTrigger>
                        <AccordionContent>
                          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                            <li>Check your internet connection and disable VPN/proxy if active.</li>
                            <li>Reload the page and ensure ports 80/443 are open.</li>
                            <li>Clear site data and retry the operation.</li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Network
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Connectivity
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="glossary" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Terms & Definitions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Core concepts used throughout Eagle Vision.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4">
                  {(grouped.glossary.length ? grouped.glossary : allTopics.filter((t) => t.category === "glossary")).map(
                    (t) => (
                      <div key={t.id} className="rounded-md border border-border bg-[--surface-2] p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <FileQuestionMark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <dt className="text-sm font-medium">{t.title}</dt>
                        </div>
                        <dd className="text-sm text-muted-foreground">{t.content}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Interactive Tutorials</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Walk through common tasks with guided overlays.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <TutorialCard
                  id="tut-change"
                  title="Change Detection Basics"
                  description="Compare two dates, refine sensitivity, and export."
                  cover="https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=1200&auto=format&fit=crop"
                  steps={[
                    {
                      icon: <LaptopMinimal className="h-4 w-4" aria-hidden="true" />,
                      title: "Open Change Detection",
                      detail: "From the map panel, open the Change Detection tool.",
                    },
                    {
                      icon: <CircleQuestionMark className="h-4 w-4" aria-hidden="true" />,
                      title: "Select dates",
                      detail: "Pick baseline and comparison dates with minimal cloud cover.",
                    },
                    {
                      icon: <Info className="h-4 w-4" aria-hidden="true" />,
                      title: "Adjust sensitivity",
                      detail: "Increase until noise appears, then step back one notch.",
                    },
                  ]}
                />
                <TutorialCard
                  id="tut-aoi"
                  title="Define an AOI & Analyze"
                  description="Draw polygons, validate coverage, and run analysis."
                  cover="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop"
                  steps={[
                    {
                      icon: <NotebookTabs className="h-4 w-4" aria-hidden="true" />,
                      title: "Draw AOI",
                      detail: "Use the polygon tool to outline your area of interest.",
                    },
                    {
                      icon: <Speech className="h-4 w-4" aria-hidden="true" />,
                      title: "Name and save",
                      detail: "Give your AOI a descriptive name and save it.",
                    },
                    {
                      icon: <MessageSquareCode className="h-4 w-4" aria-hidden="true" />,
                      title: "Run analysis",
                      detail: "Choose desired layers and click Analyze.",
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <Card className="bg-[--surface-1] border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Contact Support</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Reach out if you need personalized assistance.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-[--surface-2] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MailQuestionMark className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-medium">Email</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Get a response within 1 business day.</p>
                  <div className="mt-3">
                    <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
                      <a href="mailto:support@eagle.vision" aria-label="Email support at support@eagle.vision">
                        Email support
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-[--surface-2] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <PhoneOutgoing className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-medium">Phone</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Mon–Fri, 9am–6pm local time.</p>
                  <div className="mt-3">
                    <Button asChild variant="outline" className="border-border bg-transparent hover:bg-[--surface-1]">
                      <a href="tel:+18555550123" aria-label="Call support at +1 855 555 0123">
                        Call +1 (855) 555-0123
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-[--surface-2] p-4 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Contact className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <h4 className="text-sm font-medium">Share diagnostics</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Include current page, browser, and usage context when you reach out for faster resolution.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Contextual help
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Privacy safe
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function GuideSteps({ onSelect }: { onSelect?: (topicId: string) => void }) {
  return (
    <div className="rounded-md border border-border bg-[--surface-2] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-medium">Quickstart: Explore Your First Area</h3>
      </div>
      <ol className="space-y-3">
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
            1
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Open the map and search a location</p>
            <p className="text-sm text-muted-foreground">
              Use the global search. Press Enter to center the map.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
            2
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Toggle layers</p>
            <p className="text-sm text-muted-foreground">
              Enable satellite base, boundaries, and any analysis overlays you need.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
            3
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Analyze an AOI</p>
            <p className="text-sm text-muted-foreground">
              Draw your AOI and click Analyze to generate insights.
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
            4
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Save and share</p>
            <p className="text-sm text-muted-foreground">Save your view and share with your team.</p>
          </div>
        </li>
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="border-border bg-transparent hover:bg-[--surface-1]"
          onClick={() => onSelect?.("guide-quickstart")}
        >
          Open full guide
        </Button>
        <Button
          className="bg-primary text-primary-foreground hover:opacity-90"
          onClick={() => onSelect?.("guide-change-detection")}
        >
          Start Change Detection
        </Button>
      </div>
    </div>
  )
}

type TutorialStep = {
  icon: React.ReactNode
  title: string
  detail: string
}

function TutorialCard({
  id,
  title,
  description,
  cover,
  steps,
}: {
  id: string
  title: string
  description: string
  cover: string
  steps: TutorialStep[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[--surface-2]">
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={cover}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-2 w-full bg-primary text-primary-foreground hover:opacity-90">
              Launch walkthrough
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-lg border-border bg-[--surface-1] text-foreground"
            aria-describedby={`${id}-desc`}
          >
            <DialogHeader>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription id={`${id}-desc`} className="text-muted-foreground">
                Follow the steps below. You can keep this open while working in the app.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <ol className="space-y-3 pr-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-[--surface-2] p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        {s.icon}
                        <p className="font-medium">{s.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}