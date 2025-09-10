"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileCode2,
  PanelsLeftBottom,
  TextSearch,
  FileJson,
  Code as CodeIcon,
  FolderCode,
  Component as ComponentIcon,
  MessageSquareCode,
} from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type EndpointParam = {
  name: string;
  in: "path" | "query" | "header" | "body";
  required?: boolean;
  type: "string" | "number" | "boolean" | "object";
  description?: string;
  example?: string | number | boolean | Record<string, unknown>;
};

type Endpoint = {
  id: string;
  category: string;
  title: string;
  method: HttpMethod;
  path: string;
  description: string;
  params?: EndpointParam[];
  sampleRequest?: Record<string, unknown>;
  sampleResponse?: Record<string, unknown>;
  errors?: { code: string; status: number; message: string }[];
  rateLimit?: { limit: number; window: string; burst?: number };
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "auth-token",
    category: "Authentication",
    title: "Create Access Token",
    method: "POST",
    path: "/v1/auth/token",
    description: "Exchange your API key for a short-lived access token.",
    params: [
      { name: "x-api-key", in: "header", required: true, type: "string", description: "Your API key." },
      {
        name: "scopes",
        in: "body",
        required: false,
        type: "object",
        description: "Requested permission scopes.",
        example: { read: true, write: false },
      },
    ],
    sampleRequest: { scopes: { read: true } },
    sampleResponse: { token: "eyJhbGciOi...", expires_in: 3600 },
    errors: [
      { code: "invalid_api_key", status: 401, message: "API key is invalid or missing." },
      { code: "scope_not_allowed", status: 403, message: "Requested scopes not permitted." },
    ],
    rateLimit: { limit: 30, window: "1m" },
  },
  {
    id: "imagery-search",
    category: "Imagery",
    title: "Search Imagery",
    method: "GET",
    path: "/v1/imagery/search",
    description: "Search available satellite imagery by area, date, and cloud coverage.",
    params: [
      { name: "bbox", in: "query", required: true, type: "string", description: "Bounding box: minX,minY,maxX,maxY", example: "-122.6,37.6,-122.3,37.9" },
      { name: "start_date", in: "query", required: false, type: "string", description: "ISO start date", example: "2024-01-01" },
      { name: "end_date", in: "query", required: false, type: "string", description: "ISO end date", example: "2024-12-31" },
      { name: "cloud_pct_lte", in: "query", required: false, type: "number", description: "Max cloud coverage percent", example: 20 },
    ],
    sampleResponse: {
      results: [
        { id: "img_01", captured_at: "2024-05-10T12:00:00Z", cloud_pct: 12.4, thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=640&auto=format&fit=crop" },
        { id: "img_02", captured_at: "2024-05-11T12:00:00Z", cloud_pct: 8.3, thumbnail: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=640&auto=format&fit=crop" },
      ],
      next_cursor: null,
    },
    errors: [
      { code: "invalid_bbox", status: 422, message: "Bounding box is malformed." },
      { code: "rate_limited", status: 429, message: "Too many requests." },
    ],
    rateLimit: { limit: 120, window: "1m", burst: 60 },
  },
  {
    id: "imagery-get",
    category: "Imagery",
    title: "Get Imagery Metadata",
    method: "GET",
    path: "/v1/imagery/{image_id}",
    description: "Retrieve metadata for a specific image by ID.",
    params: [
      { name: "image_id", in: "path", required: true, type: "string", description: "Image identifier", example: "img_01" },
    ],
    sampleResponse: {
      id: "img_01",
      captured_at: "2024-05-10T12:00:00Z",
      resolution_m: 0.5,
      bands: ["R", "G", "B", "NIR"],
    },
    errors: [
      { code: "not_found", status: 404, message: "Image not found." },
      { code: "unauthorized", status: 401, message: "Missing or invalid token." },
    ],
    rateLimit: { limit: 300, window: "1m" },
  },
  {
    id: "analysis-ndvi",
    category: "Analysis",
    title: "Compute NDVI",
    method: "POST",
    path: "/v1/analysis/ndvi",
    description: "Compute NDVI for a given AOI and date range.",
    params: [
      { name: "geometry", in: "body", required: true, type: "object", description: "GeoJSON Polygon", example: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] } },
      { name: "start_date", in: "body", required: true, type: "string", description: "ISO start date", example: "2024-01-01" },
      { name: "end_date", in: "body", required: true, type: "string", description: "ISO end date", example: "2024-02-01" },
    ],
    sampleRequest: {
      geometry: { type: "Polygon", coordinates: [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]] },
      start_date: "2024-01-01",
      end_date: "2024-02-01",
    },
    sampleResponse: { mean_ndvi: 0.42, min: -0.1, max: 0.76, pixel_count: 104230 },
    errors: [
      { code: "invalid_geometry", status: 422, message: "Geometry must be a valid Polygon." },
      { code: "processing_error", status: 500, message: "Unexpected error during analysis." },
    ],
    rateLimit: { limit: 60, window: "1m" },
  },
  {
    id: "webhooks-create",
    category: "Webhooks",
    title: "Create Webhook",
    method: "POST",
    path: "/v1/webhooks",
    description: "Register a webhook to receive asynchronous event notifications.",
    params: [
      { name: "url", in: "body", required: true, type: "string", description: "HTTPS endpoint to receive events", example: "https://example.com/webhooks" },
      { name: "events", in: "body", required: true, type: "object", description: "Event types to subscribe", example: ["imagery.ready", "analysis.completed"] as unknown as Record<string, unknown> },
      { name: "secret", in: "body", required: false, type: "string", description: "Optional signing secret" },
    ],
    sampleRequest: { url: "https://example.com/hooks", events: ["imagery.ready"] },
    sampleResponse: { id: "wh_123", url: "https://example.com/hooks", events: ["imagery.ready"], status: "active" },
    errors: [
      { code: "invalid_url", status: 422, message: "URL must be HTTPS." },
      { code: "conflict", status: 409, message: "Webhook already exists for this URL." },
    ],
    rateLimit: { limit: 20, window: "1m" },
  },
];

const CATEGORIES = Array.from(new Set(ENDPOINTS.map((e) => e.category)));

type APIDocumentationProps = {
  className?: string;
  initialEndpointId?: string;
  defaultBaseUrl?: string;
};

function codeToPrettyJson(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function methodBadgeColor(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "bg-surface-2 text-foreground border border-border";
    case "POST":
      return "bg-chart-1/15 text-chart-1 border border-chart-1/30";
    case "PUT":
    case "PATCH":
      return "bg-warning/15 text-warning border border-warning/30";
    case "DELETE":
      return "bg-danger/15 text-danger border border-danger/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const LANGUAGES = ["curl", "JavaScript", "Python"] as const;
type Language = typeof LANGUAGES[number];

export default function APIDocumentation({
  className,
  initialEndpointId,
  defaultBaseUrl = "https://api.eagle.vision",
}: APIDocumentationProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(initialEndpointId && ENDPOINTS.some(e => e.id === initialEndpointId) ? initialEndpointId : ENDPOINTS[0].id);
  const [showNav, setShowNav] = useState(false);
  const [language, setLanguage] = useState<Language>("curl");
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState("");
  const [bearer, setBearer] = useState("");
  const [testBody, setTestBody] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState<string>("");
  const [responseStatus, setResponseStatus] = useState<string>("");

  const selected = useMemo(() => ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0], [selectedId]);

  useEffect(() => {
    if (selected?.sampleRequest && (selected.method === "POST" || selected.method === "PUT" || selected.method === "PATCH")) {
      setTestBody(codeToPrettyJson(selected.sampleRequest));
    } else {
      setTestBody("");
    }
    // prefill query params if GET with examples
    const qs = (selected?.params || [])
      .filter((p) => p.in === "query" && p.example !== undefined)
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(String(p.example))}`)
      .join("&");
    setTestQuery(qs);
    setResponseText("");
    setResponseStatus("");
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return ENDPOINTS;
    const q = query.toLowerCase();
    return ENDPOINTS.filter((e) => {
      const hay = [e.title, e.description, e.path, e.category, e.method, e.id].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Endpoint[]>();
    for (const c of CATEGORIES) map.set(c, []);
    for (const e of filtered) {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category)?.push(e);
    }
    return map;
  }, [filtered]);

  function copy(text: string, label = "Copied") {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.success(label);
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast.success(label),
      () => toast.error("Copy failed")
    );
  }

  function curlSnippet(e: Endpoint) {
    const url = `${baseUrl}${e.path}`;
    const hasBody = e.method !== "GET" && e.method !== "DELETE";
    const lines = [
      `curl -X ${e.method} "${url}${testQuery ? `?${testQuery}` : ""}" \\`,
      `  -H "Content-Type: application/json" \\`,
      bearer ? `  -H "Authorization: Bearer ${bearer}" \\` : apiKey ? `  -H "x-api-key: ${apiKey}" \\` : undefined,
      hasBody && testBody ? `  --data '${testBody.replace(/\n/g, " ")}'` : undefined,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }

  function jsSnippet(e: Endpoint) {
    const url = `${baseUrl}${e.path}${testQuery ? `?${testQuery}` : ""}`;
    const authHeader = bearer ? `"Authorization": "Bearer ${bearer}"` : apiKey ? `"x-api-key": "${apiKey}"` : "";
    const hasBody = e.method !== "GET" && e.method !== "DELETE";
    return [
      `const res = await fetch("${url}", {`,
      `  method: "${e.method}",`,
      `  headers: {`,
      `    "Content-Type": "application/json"${authHeader ? `,\n    ${authHeader}` : ""}`,
      `  },`,
      hasBody && testBody ? `  body: JSON.stringify(${safeParseOrRaw(testBody)}),` : "",
      `});`,
      `const data = await res.json();`,
      `console.log(data);`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function pySnippet(e: Endpoint) {
    const url = `${baseUrl}${e.path}${testQuery ? `?${testQuery}` : ""}`;
    const hasBody = e.method !== "GET" && e.method !== "DELETE";
    const authHeader = bearer ? `'Authorization': 'Bearer ${bearer}'` : apiKey ? `'x-api-key': '${apiKey}'` : "";
    return [
      `import requests`,
      ``,
      `headers = {`,
      `    'Content-Type': 'application/json'${authHeader ? `,\n    ${authHeader}` : ""}`,
      `}`,
      hasBody && testBody ? `payload = ${codeToPrettyJson(safeParseOrRaw(testBody))}` : "",
      `res = requests.request("${e.method}", "${url}", headers=headers${hasBody && testBody ? ", json=payload" : ""})`,
      `print(res.status_code)`,
      `print(res.json())`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function safeParseOrRaw(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function runTest() {
    if (typeof window === "undefined") return;
    setLoading(true);
    setResponseText("");
    setResponseStatus("");
    try {
      const url = new URL(`${baseUrl}${selected.path}`);
      if (testQuery) {
        const parts = testQuery.split("&");
        for (const p of parts) {
          const [k, v] = p.split("=");
          if (k) url.searchParams.set(decodeURIComponent(k), v ? decodeURIComponent(v) : "");
        }
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
      if (apiKey) headers["x-api-key"] = apiKey;

      const bodyAllowed = !["GET", "DELETE"].includes(selected.method);
      const res = await fetch(url.toString(), {
        method: selected.method,
        headers,
        body: bodyAllowed && testBody ? JSON.stringify(safeParseOrRaw(testBody)) : undefined,
      });
      const contentType = res.headers.get("content-type") || "";
      let body: string;
      if (contentType.includes("application/json")) {
        const json = await res.json();
        body = codeToPrettyJson(json);
      } else {
        body = await res.text();
      }
      setResponseStatus(`${res.status} ${res.statusText}`);
      setResponseText(body);
      toast.success("Request sent");
    } catch (err: unknown) {
      setResponseStatus("Request failed");
      setResponseText(String(err));
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  }

  const codeByLang = useMemo(() => {
    switch (language) {
      case "curl":
        return curlSnippet(selected);
      case "JavaScript":
        return jsSnippet(selected);
      case "Python":
        return pySnippet(selected);
    }
  }, [language, selected, apiKey, bearer, baseUrl, testBody, testQuery]);

  function MethodBadge({ method }: { method: HttpMethod }) {
    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${methodBadgeColor(method)}`}>{method}</span>;
  }

  return (
    <TooltipProvider>
      <section className={`w-full max-w-full bg-surface-1 text-foreground rounded-lg border border-border ${className ?? ""}`}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="size-5 text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate">Eagle Vision API</h2>
            <Badge className="ml-2 bg-surface-2 text-muted-foreground border border-border">v1</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <TextSearch className="size-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <Input
                aria-label="Search endpoints"
                placeholder="Search endpoints..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-surface-2 border-border text-sm"
              />
            </div>
            <Button
              variant="secondary"
              className="sm:hidden bg-surface-2 hover:bg-surface-2/80"
              onClick={() => setShowNav((s) => !s)}
              aria-expanded={showNav}
              aria-controls="api-side-nav"
            >
              <PanelsLeftBottom className="size-4 mr-2" />
              {showNav ? "Hide" : "Menu"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
          <aside
            id="api-side-nav"
            className={`border-r border-border md:block ${showNav ? "block" : "hidden"} bg-surface-1`}
          >
            <div className="p-3 border-b border-border sm:hidden">
              <div className="relative">
                <TextSearch className="size-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  aria-label="Search endpoints"
                  placeholder="Search endpoints..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-surface-2 border-border text-sm"
                />
              </div>
            </div>
            <ScrollArea className="h-[360px] md:h-[720px]">
              <nav className="p-3">
                {CATEGORIES.map((cat) => {
                  const list = grouped.get(cat) || [];
                  if (list.length === 0) return null;
                  return (
                    <div key={cat} className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1">
                        {cat === "Authentication" ? (
                          <ComponentIcon className="size-4 text-muted-foreground" />
                        ) : cat === "Imagery" ? (
                          <FolderCode className="size-4 text-muted-foreground" />
                        ) : cat === "Analysis" ? (
                          <MessageSquareCode className="size-4 text-muted-foreground" />
                        ) : (
                          <CodeIcon className="size-4 text-muted-foreground" />
                        )}
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cat}</h3>
                      </div>
                      <ul className="mt-1">
                        {list.map((e) => {
                          const active = e.id === selectedId;
                          return (
                            <li key={e.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId(e.id);
                                  setShowNav(false);
                                }}
                                className={`w-full text-left px-2 py-2 rounded-md flex items-center gap-2 hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-ring ${active ? "bg-surface-2" : ""}`}
                                aria-current={active ? "page" : undefined}
                              >
                                <MethodBadge method={e.method} />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{e.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">{e.path}</div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </nav>
            </ScrollArea>
          </aside>

          <main className="min-w-0">
            <div className="p-4 md:p-6">
              <div className="flex flex-wrap items-start gap-3">
                <MethodBadge method={selected.method} />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold leading-tight break-words">{selected.title}</h1>
                  <p className="text-sm text-muted-foreground break-words">{selected.description}</p>
                </div>
                <div className="ml-auto">
                  {selected.rateLimit ? (
                    <Badge className="bg-surface-2 text-muted-foreground border border-border" aria-label="Rate limit">
                      {selected.rateLimit.limit}/{selected.rateLimit.window}
                      {selected.rateLimit.burst ? ` • burst ${selected.rateLimit.burst}` : ""}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <Card className="mt-4 bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-muted-foreground">
                    Use either an API key or a Bearer token. API keys authenticate simple requests. For higher security,
                    exchange your API key for a short-lived token using the <span className="font-medium text-foreground">Create Access Token</span> endpoint.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">x-api-key</Label>
                      <Input
                        id="apiKey"
                        placeholder="Enter API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-surface-2 border-border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bearer">Bearer token</Label>
                      <Input
                        id="bearer"
                        placeholder="eyJhbGciOi..."
                        value={bearer}
                        onChange={(e) => setBearer(e.target.value)}
                        className="bg-surface-2 border-border"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        placeholder="https://api.eagle.vision"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="bg-surface-2 border-border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Auth header preview</Label>
                      <code className="text-xs bg-surface-2 border border-border rounded-md px-2 py-2 break-words">
                        {bearer ? "Authorization: Bearer •••" : apiKey ? "x-api-key: •••" : "No auth"}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 grid gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {selected.params && selected.params.length > 0 ? (
                      <div className="grid gap-2">
                        {selected.params.map((p) => (
                          <div key={p.name} className="flex items-start gap-3">
                            <Badge className="bg-surface-2 text-muted-foreground border border-border shrink-0 mt-0.5">
                              {p.in}
                            </Badge>
                            <div className="min-w-0">
                              <div className="text-sm font-medium break-words">
                                {p.name}
                                {p.required ? <span className="text-danger ml-1">*</span> : null}
                                <span className="ml-2 text-xs text-muted-foreground">{p.type}</span>
                              </div>
                              {p.description ? (
                                <div className="text-xs text-muted-foreground break-words">{p.description}</div>
                              ) : null}
                              {typeof p.example !== "undefined" ? (
                                <div className="text-xs mt-1">
                                  <span className="text-muted-foreground">Example: </span>
                                  <code className="bg-surface-2 border border-border rounded px-1 py-0.5">{typeof p.example === "object" ? "object" : String(p.example)}</code>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This endpoint does not require parameters.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">API Explorer</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-surface-2 text-muted-foreground border border-border">{selected.method}</Badge>
                        <code className="text-xs text-muted-foreground break-words">{selected.path}</code>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 pt-4">
                    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="query">Query string</Label>
                          <Input
                            id="query"
                            placeholder="param=value&other=123"
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            className="bg-surface-2 border-border"
                          />
                        </div>
                        {selected.method !== "GET" && selected.method !== "DELETE" ? (
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="body">Request body (JSON)</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => setTestBody(selected.sampleRequest ? codeToPrettyJson(selected.sampleRequest) : "{\n  \n}")}
                                  >
                                    Prefill
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover text-popover-foreground border border-border">
                                  Use sample request
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <textarea
                              id="body"
                              rows={8}
                              value={testBody}
                              onChange={(e) => setTestBody(e.target.value)}
                              className="w-full rounded-md bg-surface-2 border border-border text-sm p-3 font-mono leading-5 resize-y"
                              spellCheck={false}
                              aria-label="Request body JSON"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={runTest}
                            disabled={loading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {loading ? "Sending..." : "Send request"}
                          </Button>
                          <Button
                            variant="secondary"
                            className="bg-surface-2 hover:bg-surface-2/80"
                            onClick={() => {
                              setResponseText("");
                              setResponseStatus("");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2 min-w-0">
                        <div className="flex items-center justify-between">
                          <Label>Response</Label>
                          <span className="text-xs text-muted-foreground">{responseStatus || "—"}</span>
                        </div>
                        <div className="relative">
                          <pre className="bg-surface-2 border border-border rounded-md p-3 text-xs leading-5 overflow-x-auto max-w-full">
                            <code className="break-words whitespace-pre">{responseText || (selected.sampleResponse ? codeToPrettyJson(selected.sampleResponse) : "// Response will appear here")}</code>
                          </pre>
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 bg-surface-1/60 hover:bg-surface-1 border-border"
                              onClick={() => copy(responseText || codeToPrettyJson(selected.sampleResponse || {}), "Response copied")}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border" />

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Code examples</h3>
                        <Tabs value={language} onValueChange={(v) => setLanguage(v as Language)}>
                          <TabsList className="bg-surface-2">
                            {LANGUAGES.map((l) => (
                              <TabsTrigger key={l} value={l} className="text-xs">
                                {l}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="code">
                          <AccordionTrigger className="text-sm">Show example</AccordionTrigger>
                          <AccordionContent>
                            <div className="relative">
                              <pre className="bg-surface-2 border border-border rounded-md p-3 text-xs leading-5 overflow-x-auto">
                                <code className="whitespace-pre break-words">{codeByLang}</code>
                              </pre>
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 bg-surface-1/60 hover:bg-surface-1 border-border"
                                  onClick={() => copy(String(codeByLang), "Snippet copied")}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Response format</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <p className="text-sm text-muted-foreground">
                      All responses are JSON encoded using UTF-8. Timestamps are ISO 8601. Lists are paginated with a
                      cursor when applicable. Non-2xx responses include an <code className="bg-surface-2 border border-border px-1 py-0.5 rounded">error.code</code> and
                      human-readable <code className="bg-surface-2 border border-border px-1 py-0.5 rounded">error.message</code>.
                    </p>
                    <div className="relative">
                      <div className="absolute -top-3 left-3 flex items-center gap-2">
                        <FileJson className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Example</span>
                      </div>
                      <pre className="bg-surface-2 border border-border rounded-md p-3 text-xs leading-5 overflow-x-auto mt-2">
                        <code>{`{
  "data": { /* resource */ },
  "error": null,
  "meta": { "request_id": "req_123", "took_ms": 12 }
}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Error codes</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {selected.errors && selected.errors.length > 0 ? (
                      <div className="grid gap-2">
                        {selected.errors.map((er) => (
                          <div key={er.code} className="flex items-start gap-3">
                            <Badge className="bg-danger/15 text-danger border border-danger/30">{er.status}</Badge>
                            <div className="min-w-0">
                              <div className="text-sm font-medium break-words">{er.code}</div>
                              <div className="text-xs text-muted-foreground break-words">{er.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific error codes for this endpoint.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">SDKs & tools</CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <CodeIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">JavaScript / TypeScript</span>
                      </div>
                      <div className="relative">
                        <pre className="bg-surface-2 border border-border rounded-md p-2 text-xs overflow-x-auto">
                          <code>npm install @eagle-vision/sdk</code>
                        </pre>
                        <div className="absolute top-1.5 right-1.5">
                          <Button size="sm" variant="secondary" className="h-7 bg-surface-1/60 hover:bg-surface-1 border-border" onClick={() => copy("npm install @eagle-vision/sdk")}>Copy</Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <CodeIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Python</span>
                      </div>
                      <div className="relative">
                        <pre className="bg-surface-2 border border-border rounded-md p-2 text-xs overflow-x-auto">
                          <code>pip install eagle-vision</code>
                        </pre>
                        <div className="absolute top-1.5 right-1.5">
                          <Button size="sm" variant="secondary" className="h-7 bg-surface-1/60 hover:bg-surface-1 border-border" onClick={() => copy("pip install eagle-vision")}>Copy</Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <CodeIcon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">CLI</span>
                      </div>
                      <div className="relative">
                        <pre className="bg-surface-2 border border-border rounded-md p-2 text-xs overflow-x-auto">
                          <code>npx @eagle-vision/cli --help</code>
                        </pre>
                        <div className="absolute top-1.5 right-1.5">
                          <Button size="sm" variant="secondary" className="h-7 bg-surface-1/60 hover:bg-surface-1 border-border" onClick={() => copy("npx @eagle-vision/cli --help")}>Copy</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Explore type definitions, retries, and streaming helpers in the official SDKs.
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </main>
        </div>

        <footer className="px-4 md:px-6 py-4 border-t border-border bg-surface-1">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <PanelsLeftBottom className="size-4" />
              Interactive API explorer
            </span>
            <span className="flex items-center gap-2">
              <TextSearch className="size-4" />
              Searchable endpoints
            </span>
          </div>
        </footer>
      </section>
    </TooltipProvider>
  );
}