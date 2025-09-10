"use client";

import * as React from "react";
import { LayoutList, FileJson2, DraftingCompass, Workflow, CloudCog, FileCode2, Cpu, Tablet, PencilRuler } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export interface DataSourcesMethodologyProps {
  className?: string;
}

export default function DataSourcesMethodology({ className }: DataSourcesMethodologyProps) {
  return (
    <section
      className={cn(
        "w-full max-w-full bg-[var(--surface-1)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6 md:p-8",
        className
      )}
      aria-labelledby="data-methodology-heading"
    >
      <div className="w-full max-w-full space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Workflow className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span className="text-xs font-medium tracking-wide uppercase">Technical transparency</span>
          </div>
          <h2 id="data-methodology-heading" className="text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-tight">
            Data sources and methodology
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-muted-foreground)] max-w-3xl">
            A concise overview of how Eagle Vision ingests, cleans, and analyzes geospatial data to deliver trustworthy insights.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <LayoutList className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                  Data providers
                </CardTitle>
                <Badge variant="secondary" className="bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
                  Curated
                </Badge>
              </div>
              <CardDescription className="text-[var(--color-muted-foreground)]">
                Primary data sources with coverage and refresh frequency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProviderRow
                name="Sentinel‑2 (ESA)"
                details="10m multispectral imagery (L2A). Global coverage."
                frequency="5 days (mid-latitudes), rolling ingestion"
                status="Operational"
                tags={["Optical", "MSI", "L2A"]}
              />
              <Separator className="bg-[var(--color-border)]" />
              <ProviderRow
                name="National & regional GIS"
                details="Administrative boundaries, parcels, land use layers."
                frequency="Varies by authority, monitored weekly"
                status="Mixed"
                tags={["Parcels", "Zoning", "Boundaries"]}
              />
              <Separator className="bg-[var(--color-border)]" />
              <ProviderRow
                name="Property price feeds"
                details="Market listings and transaction aggregates."
                frequency="Daily deltas, weekly reconciliation"
                status="Operational"
                tags={["Listings", "Sales", "Aggregates"]}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Notes: Satellite acquisitions may be skipped under heavy cloud. We backfill on next clear pass.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <DraftingCompass className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                Methodology summary
              </CardTitle>
              <CardDescription className="text-[var(--color-muted-foreground)]">
                Two perspectives: plain language and technical detail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="everyone" className="w-full">
                <TabsList className="grid grid-cols-2 bg-[var(--surface-1)]">
                  <TabsTrigger value="everyone" className="data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-[var(--color-primary-foreground)]">
                    For everyone
                  </TabsTrigger>
                  <TabsTrigger value="experts" className="data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-[var(--color-primary-foreground)]">
                    For experts
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="everyone" className="space-y-3">
                  <PlainPoint
                    icon={<Tablet className="h-4 w-4" aria-hidden />}
                    title="See‑through clouds and clean images"
                    text="We remove cloudy parts of satellite photos and combine the clearest pixels so you always see the ground, not the weather."
                  />
                  <PlainPoint
                    icon={<Cpu className="h-4 w-4" aria-hidden />}
                    title="AI spots patterns"
                    text="Our models highlight changes in land, vegetation, and buildings so you can focus on what matters."
                  />
                  <PlainPoint
                    icon={<PencilRuler className="h-4 w-4" aria-hidden />}
                    title="Checked against reality"
                    text="We routinely compare our results with known ground truth to make sure the numbers stay accurate."
                  />
                </TabsContent>
                <TabsContent value="experts" className="space-y-3">
                  <TechPoint
                    icon={<FileCode2 className="h-4 w-4" aria-hidden />}
                    title="Segmentation backbone"
                    text="U‑Net style encoder‑decoder with skip connections, trained on stratified tiles; augmentations include rotations, spectral jitter, and CutMix."
                  />
                  <TechPoint
                    icon={<CloudCog className="h-4 w-4" aria-hidden />}
                    title="Cloud & shadow masking"
                    text="Hybrid: scene classification layers + morphological post‑processing; fallback to multi‑temporal compositing to fill occlusions."
                  />
                  <TechPoint
                    icon={<Workflow className="h-4 w-4" aria-hidden />}
                    title="Reasoning & summarization"
                    text="Gemini‑class LLM converts model outputs and metadata into human‑readable narratives; never used to generate raw detections."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-[var(--surface-2)] border-[var(--color-border)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileJson2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                Processing pipeline
              </CardTitle>
              <CardDescription className="text-[var(--color-muted-foreground)]">
                High‑level diagram of ingestion, filtering, analysis, and delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineDiagram />
              <p className="sr-only">
                Diagram: Ingest → Preprocess → Cloud mask → U‑Net segmentation → Post‑process → Quality metrics → API/Map.
              </p>
            </CardContent>
          </Card>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="cloud-filtering" className="border-b border-[var(--color-border)]">
            <AccordionTrigger className="text-left">
              Cloud filtering and compositing
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CloudCog className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      Approach
                    </CardTitle>
                    <CardDescription className="text-[var(--color-muted-foreground)]">
                      Multi‑method mask with temporal backfill.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ul className="list-disc pl-5 space-y-1 text-[var(--color-foreground)]">
                      <li>S2 scene classification map (SCL) thresholding.</li>
                      <li>Shadow detection via geometry + NDVI drop.</li>
                      <li>Morphological opening/closing to remove speckle.</li>
                      <li>Multi‑date median composite to fill gaps.</li>
                    </ul>
                    <ExternalLink href="https://www.sciencedirect.com/science/article/abs/pii/S0034425716301305">
                      Fmask reference
                    </ExternalLink>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutList className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      Parameters
                    </CardTitle>
                    <CardDescription className="text-[var(--color-muted-foreground)]">Defaults</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <Param label="SCL threshold" value="≥ 7 (cloud prob.)" />
                      <Param label="Shadow azimuth" value="Solar − 180°" />
                      <Param label="Composite window" value="30 days" />
                      <Param label="Morph. radius" value="1–2 px" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PencilRuler className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      Caveats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-[var(--color-muted-foreground)]">
                    Residual haze and thin clouds may persist in coastal or high‑albedo regions. We flag low‑confidence tiles and exclude them from quantitative analyses.
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="accuracy-metrics" className="border-b border-[var(--color-border)]">
            <AccordionTrigger className="text-left">
              Accuracy and model quality
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <MetricCard label="Mean IoU" value={86} help="Intersection over Union across validation regions." />
                <MetricCard label="Precision" value={91} help="Positive predictive value on held‑out tiles." />
                <MetricCard label="Recall" value={88} help="Sensitivity to true positives." />
              </div>
              <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                Metrics reported on stratified validation sets spanning urban, agricultural, and forested biomes. Confidence intervals available upon request.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy" className="border-b border-[var(--color-border)]">
            <AccordionTrigger className="text-left">
              Privacy, security, and compliance
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                <p>
                  We process only non‑personally identifiable satellite and GIS data. Any user‑uploaded datasets are encrypted in transit and at rest; access is role‑scoped and audited.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No biometric or device identifiers stored.</li>
                  <li>Least‑privilege access with periodic key rotation.</li>
                  <li>Aggregate reporting with k‑anonymity thresholds where applicable.</li>
                </ul>
                <p className="text-[var(--color-muted-foreground)]">
                  Compliance: GDPR (processor), SOC2‑aligned controls, and regional data residency on request.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="update-cycles" className="border-b border-[var(--color-border)]">
            <AccordionTrigger className="text-left">
              Data update cycles
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutList className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      Satellite imagery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ScheduleRow label="Acquisition" value="Every 5 days (mid‑latitudes)" />
                    <ScheduleRow label="Ingestion" value="Within 6–24h of release" />
                    <ScheduleRow label="Processing" value="Near‑real‑time (NRT) and weekly composites" />
                  </CardContent>
                </Card>
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileJson2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      GIS & property datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ScheduleRow label="Listings feed" value="Nightly" />
                    <ScheduleRow label="Transactions" value="Weekly reconciliation" />
                    <ScheduleRow label="Zoning/parcels" value="Monthly checks; event‑driven where supported" />
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="docs-papers" className="border-b border-[var(--color-border)]">
            <AccordionTrigger className="text-left">
              Documentation and academic references
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      Model and methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 break-words">
                    <ExternalLink href="https://arxiv.org/abs/1505.04597">U‑Net: Convolutional Networks for Biomedical Image Segmentation</ExternalLink>
                    <ExternalLink href="https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED">
                      Sentinel‑2 Level‑2A (harmonized) dataset
                    </ExternalLink>
                    <ExternalLink href="https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi">
                      Sentinel‑2 MSI user guide
                    </ExternalLink>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DraftingCompass className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      System design and governance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 break-words">
                    <ExternalLink href="https://ai.google.dev/gemini-docs">Gemini model documentation</ExternalLink>
                    <ExternalLink href="https://www.iso.org/standard/41526.html">ISO/IEC 27001 overview</ExternalLink>
                    <ExternalLink href="https://gdpr.eu/">GDPR resources</ExternalLink>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

function ProviderRow(props: {
  name: string;
  details: string;
  frequency: string;
  status: "Operational" | "Mixed" | "Paused" | string;
  tags?: string[];
}) {
  const badgeColor =
    props.status === "Operational"
      ? "bg-[var(--success)] text-[var(--color-primary-foreground)]"
      : props.status === "Paused"
      ? "bg-[var(--danger)] text-[var(--color-primary-foreground)]"
      : "bg-[var(--warning)] text-[var(--color-primary-foreground)]";
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        <Tablet className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{props.name}</h3>
          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", badgeColor)} aria-label={`Status: ${props.status}`}>
            {props.status}
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">{props.details}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {props.tags?.map((t) => (
            <Badge key={t} variant="outline" className="border-[var(--color-border)] text-[var(--color-foreground)]">
              {t}
            </Badge>
          ))}
          <span className="text-xs text-[var(--color-muted-foreground)]">Refresh: {props.frequency}</span>
        </div>
      </div>
    </div>
  );
}

function PlainPoint(props: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[var(--color-primary)]">{props.icon}</div>
      <div className="min-w-0">
        <h4 className="font-medium">{props.title}</h4>
        <p className="text-sm text-[var(--color-muted-foreground)]">{props.text}</p>
      </div>
    </div>
  );
}

function TechPoint(props: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[var(--color-primary)]">{props.icon}</div>
      <div className="min-w-0">
        <h4 className="font-medium">{props.title}</h4>
        <p className="text-sm text-[var(--color-muted-foreground)]">{props.text}</p>
      </div>
    </div>
  );
}

function Param(props: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--surface-1)] border border-[var(--color-border)] p-2">
      <div className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted-foreground)]">{props.label}</div>
      <div className="text-sm">{props.value}</div>
    </div>
  );
}

function MetricCard(props: { label: string; value: number; help?: string }) {
  const colorClass =
    props.value >= 90 ? "bg-[var(--success)]" : props.value >= 80 ? "bg-[var(--warning)]" : "bg-[var(--danger)]";
  return (
    <Card className="bg-[var(--surface-2)] border-[var(--color-border)]">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="min-w-0">{props.label}</span>
          <Badge className="bg-[var(--surface-1)] text-[var(--color-foreground)] border border-[var(--color-border)]">
            {props.value}%
          </Badge>
        </CardTitle>
        {props.help ? <CardDescription className="text-[var(--color-muted-foreground)]">{props.help}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Progress value={props.value} className="h-2 bg-[var(--surface-1)]" />
          <div
            className={cn("pointer-events-none absolute left-0 top-0 h-2 rounded", colorClass)}
            style={{ width: `${props.value}%` }}
            aria-hidden
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-[var(--color-muted-foreground)]">{props.label}</span>
      <span className="text-right font-medium min-w-0 break-words">{props.value}</span>
    </div>
  );
}

function ExternalLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded px-1 -mx-1"
      href={props.href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {props.children}
      <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
        <path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3Z" />
        <path d="M5 5h6v2H7v10h10v-4h2v6H5V5Z" />
      </svg>
    </a>
  );
}

function PipelineDiagram() {
  // Simple responsive block diagram using flex and SVG connectors
  const steps = [
    { label: "Ingest", icon: <LayoutList className="h-4 w-4" aria-hidden /> },
    { label: "Preprocess", icon: <FileJson2 className="h-4 w-4" aria-hidden /> },
    { label: "Cloud mask", icon: <CloudCog className="h-4 w-4" aria-hidden /> },
    { label: "U‑Net", icon: <Cpu className="h-4 w-4" aria-hidden /> },
    { label: "Post‑process", icon: <PencilRuler className="h-4 w-4" aria-hidden /> },
    { label: "Quality", icon: <DraftingCompass className="h-4 w-4" aria-hidden /> },
    { label: "API / Map", icon: <Workflow className="h-4 w-4" aria-hidden /> },
  ];
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px] lg:min-w-0 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="relative rounded-lg bg-[var(--surface-1)] border border-[var(--color-border)] px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-primary)]">{s.icon}</span>
                <span className="font-medium">{s.label}</span>
              </div>
            </div>
            {i < steps.length - 1 ? (
              <Connector key={`c-${s.label}`} />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center lg:w-10">
      <svg width="32" height="16" viewBox="0 0 32 16" className="text-[var(--color-border)]" aria-hidden>
        <path d="M0 8h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}