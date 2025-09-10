"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Contact,
  LaptopMinimal,
  UsersRound,
  ExternalLink,
  Linkedin,
  BookUser,
  IdCard,
  SquareUserRound,
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  linkedin?: string;
  bio?: string;
};

type Resource = {
  id: string;
  title: string;
  description?: string;
  href: string;
};

type AboutProjectProps = {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  subtitle?: string;
  mission?: string;
  background?: string;
  goals?: string[];
  techStack?: string[];
  resources?: Resource[];
  teamMembers?: TeamMember[];
  onSubmitContact?: (values: ContactFormValues) => Promise<void> | void;
};

const contactSchema = z.object({
  name: z.string().min(2, "Please enter at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject is too short."),
  message: z.string().min(10, "Message should be at least 10 characters."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const defaultTeam: TeamMember[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Product Lead",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=512&auto=format&fit=crop",
    linkedin: "https://www.linkedin.com/",
    bio: "Guiding product strategy for mission-focused geospatial intelligence.",
  },
  {
    id: "2",
    name: "Samira Khan",
    role: "Lead Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=512&auto=format&fit=crop",
    linkedin: "https://www.linkedin.com/",
    bio: "Architecting reliable data pipelines and realtime map experiences.",
  },
  {
    id: "3",
    name: "Diego Chen",
    role: "AI Research",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=512&auto=format&fit=crop",
    linkedin: "https://www.linkedin.com/",
    bio: "Applying ML to satellite imagery for actionable insights.",
  },
  {
    id: "4",
    name: "Taylor Brooks",
    role: "Design & UX",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=512&auto=format&fit=crop",
    linkedin: "https://www.linkedin.com/",
    bio: "Designing focused interfaces that elevate complex workflows.",
  },
];

const defaultResources: Resource[] = [
  {
    id: "r1",
    title: "API Documentation",
    description: "Endpoints, schemas, and usage examples.",
    href: "https://example.com/docs",
  },
  {
    id: "r2",
    title: "Open-source Repo",
    description: "Core libraries and UI components.",
    href: "https://github.com/",
  },
  {
    id: "r3",
    title: "Design Guidelines",
    description: "Visual language and interaction patterns.",
    href: "https://example.com/design",
  },
];

const defaultTechStack = [
  "Next.js 15",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Zod",
  "React Hook Form",
];

export default function AboutProject({
  className,
  style,
  title = "About Eagle Vision",
  subtitle = "Project overview, mission, and the team behind the work.",
  mission = "We empower organizations with precise, real-time geospatial intelligence through a focused, accessible experience that turns satellite data into clear decisions.",
  background = "Eagle Vision began as a mission to simplify complex satellite analysis for teams who need reliable, timely insights. Our platform combines performant rendering, robust data pipelines, and elegant interfaces to deliver clarity at every step.",
  goals = [
    "Deliver trustworthy, real-time map insights with minimal latency.",
    "Offer approachable tools that scale from analysts to developers.",
    "Advance open-source geospatial tooling for the community.",
  ],
  techStack = defaultTechStack,
  resources = defaultResources,
  teamMembers = defaultTeam,
  onSubmitContact,
}: AboutProjectProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const orderedGoals = useMemo(() => goals.slice(0, 6), [goals]);

  async function handleSubmit(values: ContactFormValues) {
    setSubmitting(true);
    try {
      if (onSubmitContact) {
        await onSubmitContact(values);
      } else {
        // Simulate network latency
        await new Promise((r) => setTimeout(r, 900));
      }
      setSubmitted(true);
      form.reset();
      toast.success("Message sent successfully");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className={["w-full max-w-full", className].filter(Boolean).join(" ")}
      style={style}
      aria-label="About Eagle Vision"
    >
      {/* Intro */}
      <div className="w-full max-w-full space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          <SquareUserRound className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium">About</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        {/* Mission + Background */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <BookUser className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl">Mission</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Why we build Eagle Vision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base leading-relaxed">{mission}</p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <LaptopMinimal className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-xl">Background</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                How the project started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base leading-relaxed break-words">
                {background}
              </p>
              <Separator className="bg-border" />
              <div>
                <h3 className="font-medium mb-3">Core goals</h3>
                <ul className="grid gap-2">
                  {orderedGoals.map((g, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary/80" aria-hidden="true" />
                      <span className="text-sm sm:text-base">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Core technologies</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Foundation of the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground border border-border"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Open-source & resources</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Documentation, repositories, and guides
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-4 rounded-lg border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="mt-1">
                  <UsersRound className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {r.description}
                    </p>
                  ) : null}
                </div>
                <ExternalLink
                  className="ml-auto h-4 w-4 text-muted-foreground opacity-70 transition group-hover:opacity-100"
                  aria-hidden="true"
                />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Team */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-semibold">Team</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((m) => (
              <Card
                key={m.id}
                className="group relative border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus-within:ring-1 focus-within:ring-primary"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-1 ring-border">
                      <AvatarImage
                        src={m.avatarUrl}
                        alt={`${m.name} portrait`}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{m.role}</p>
                    </div>
                    {m.linkedin ? (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Open ${m.name}'s LinkedIn`}
                        title="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  {m.bio ? (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                      {m.bio}
                    </p>
                  ) : null}
                </CardContent>
                <div className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius)-2px)] ring-0 ring-primary/0 transition group-hover:ring-2 group-hover:ring-primary/30" />
              </Card>
            ))}
          </div>
        </div>

        {/* Contact */}
        <Card
          className="border border-border bg-card"
          aria-labelledby="contact-heading"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Contact className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle id="contact-heading" className="text-xl">
                Contact us
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Questions, ideas, or partnerships — we’d love to hear from you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-border bg-secondary/40 p-4 text-sm"
              >
                Thanks for reaching out — we’ll get back to you shortly.
              </div>
            ) : (
              <form
                noValidate
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid gap-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      aria-invalid={!!form.formState.errors.name}
                      {...form.register("name")}
                      className="bg-secondary/40 border-border"
                    />
                    {form.formState.errors.name ? (
                      <p className="text-xs text-danger">
                        {form.formState.errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      aria-invalid={!!form.formState.errors.email}
                      {...form.register("email")}
                      className="bg-secondary/40 border-border"
                      inputMode="email"
                    />
                    {form.formState.errors.email ? (
                      <p className="text-xs text-danger">
                        {form.formState.errors.email.message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="How can we help?"
                    aria-invalid={!!form.formState.errors.subject}
                    {...form.register("subject")}
                    className="bg-secondary/40 border-border"
                  />
                  {form.formState.errors.subject ? (
                    <p className="text-xs text-danger">
                      {form.formState.errors.subject.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Share a bit more about your needs..."
                    rows={5}
                    aria-invalid={!!form.formState.errors.message}
                    {...form.register("message")}
                    className="bg-secondary/40 border-border resize-y min-h-[120px]"
                  />
                  {form.formState.errors.message ? (
                    <p className="text-xs text-danger">
                      {form.formState.errors.message.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {submitting ? "Sending..." : "Send message"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => form.reset()}
                    disabled={submitting}
                    className="border border-border"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}