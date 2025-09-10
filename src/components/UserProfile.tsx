"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CircleUser,
  Fingerprint,
  IdCard,
  Key,
  KeyRound,
  LogIn,
  ShieldUser,
  User,
  UserCog,
  UserLock,
  UserPen,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type SavedQuery = {
  id: string;
  name: string;
  query: string;
  updatedAt: string;
};

type FavoriteRegion = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
};

type DownloadedReport = {
  id: string;
  title: string;
  format: "pdf" | "csv" | "geojson";
  sizeMB: number;
  createdAt: string;
};

type ActivityItem = {
  id: string;
  type: "login" | "export" | "query" | "preference" | "security";
  detail: string;
  at: string;
};

export type UserProfileData = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  organization?: string | null;
  role?: string | null;
  preferences?: {
    emailAlerts: boolean;
    productUpdates: boolean;
    compactMode: boolean;
    analyticsConsent: boolean;
    language: "en" | "es" | "fr" | "de";
  };
  security?: {
    mfaEnabled: boolean;
    lastPasswordChange?: string;
    sessions?: number;
  };
};

export type UserProfileProps = {
  className?: string;
  style?: React.CSSProperties;
  user?: UserProfileData | null;
  savedQueries?: SavedQuery[];
  favoriteRegions?: FavoriteRegion[];
  downloads?: DownloadedReport[];
  activity?: ActivityItem[];
  initialTab?:
    | "signin"
    | "signup"
    | "reset"
    | "dashboard"
    | "queries"
    | "favorites"
    | "downloads"
    | "settings"
    | "security"
    | "privacy"
    | "activity";
  // Callbacks to integrate with app auth/data
  onSignIn?: (email: string, password: string) => Promise<void> | void;
  onSignUp?: (name: string, email: string, password: string) => Promise<void> | void;
  onResetPassword?: (email: string) => Promise<void> | void;
  onUpdateProfile?: (partial: Partial<UserProfileData>) => Promise<void> | void;
  onExportData?: () => Promise<void> | void;
  onToggleMfa?: (enable: boolean) => Promise<void> | void;
  onRevokeSessions?: () => Promise<void> | void;
  onDeleteAccount?: () => Promise<void> | void;
  onDownloadReport?: (id: string) => Promise<void> | void;
  onRemoveSavedQuery?: (id: string) => Promise<void> | void;
  onRemoveFavorite?: (id: string) => Promise<void> | void;
};

type AuthMode = "signin" | "signup" | "reset";

const SectionHeader: React.FC<{ icon?: React.ReactNode; title: string; desc?: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="flex items-start gap-3">
    <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
      {icon}
    </div>
    <div className="min-w-0">
      <h3 className="text-base sm:text-lg font-semibold leading-tight">{title}</h3>
      {desc ? (
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      ) : null}
    </div>
  </div>
);

const EmptyState: React.FC<{ title: string; description?: string; icon?: React.ReactNode; cta?: React.ReactNode }> = ({
  title,
  description,
  icon,
  cta,
}) => (
  <div className="w-full rounded-lg border bg-card p-6 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 text-secondary-foreground">
      {icon}
    </div>
    <h4 className="mt-3 font-medium">{title}</h4>
    {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    {cta ? <div className="mt-4">{cta}</div> : null}
  </div>
);

const Field: React.FC<{
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  description?: string;
  required?: boolean;
  message?: string;
  orientation?: "vertical" | "horizontal";
}> = ({ label, htmlFor, children, description, required, message, orientation = "vertical" }) => (
  <div className={cn("w-full", orientation === "horizontal" ? "grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 items-center" : "space-y-2")}>
    <Label htmlFor={htmlFor} className={cn("text-sm", orientation === "horizontal" ? "sm:col-span-1" : "")}>
      {label}
      {required ? <span className="ml-1 text-primary" aria-hidden>*</span> : null}
    </Label>
    <div className={cn(orientation === "horizontal" ? "sm:col-span-2" : "space-y-1")}>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {message ? <p className="text-xs text-danger">{message}</p> : null}
    </div>
  </div>
);

function useControlledState<T>(external: T | undefined, fallback: T) {
  const [internal, setInternal] = useState<T>(external ?? fallback);
  useEffect(() => {
    if (external !== undefined) setInternal(external);
  }, [external]);
  return [internal, setInternal] as const;
}

export default function UserProfile({
  className,
  style,
  user,
  savedQueries = [],
  favoriteRegions = [],
  downloads = [],
  activity = [],
  initialTab,
  onSignIn,
  onSignUp,
  onResetPassword,
  onUpdateProfile,
  onExportData,
  onToggleMfa,
  onRevokeSessions,
  onDeleteAccount,
  onDownloadReport,
  onRemoveSavedQuery,
  onRemoveFavorite,
}: UserProfileProps) {
  const isAuthed = !!user;
  const defaultAuthedTab = "dashboard";
  const defaultAuthTab: AuthMode = "signin";

  const [activeTab, setActiveTab] = useControlledState<string | undefined>(
    initialTab,
    isAuthed ? defaultAuthedTab : defaultAuthTab
  );

  useEffect(() => {
    // Keep activeTab aligned when auth state changes
    setActiveTab((prev) => {
      if (isAuthed) {
        if (!prev || ["signin", "signup", "reset"].includes(prev)) return defaultAuthedTab;
      } else {
        if (!prev || !["signin", "signup", "reset"].includes(prev)) return defaultAuthTab;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // Auth forms state
  const [authLoading, setAuthLoading] = useState(false);
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const strongPassword = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, []);

  const signinErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (signinEmail && !emailRegex.test(signinEmail)) errs.email = "Enter a valid email address.";
    if (signinPassword && signinPassword.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  }, [signinEmail, signinPassword, emailRegex]);

  const signupErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (signupName && signupName.length < 2) errs.name = "Name must be at least 2 characters.";
    if (signupEmail && !emailRegex.test(signupEmail)) errs.email = "Enter a valid email address.";
    if (signupPassword && !strongPassword.test(signupPassword))
      errs.password = "Use 8+ chars with letters and numbers.";
    return errs;
  }, [signupName, signupEmail, signupPassword, emailRegex, strongPassword]);

  const resetErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (resetEmail && !emailRegex.test(resetEmail)) errs.email = "Enter a valid email address.";
    return errs;
  }, [resetEmail, emailRegex]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signinEmail || !signinPassword) {
      toast.error("Please enter your email and password.");
      return;
    }
    if (Object.keys(signinErrors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      setAuthLoading(true);
      await onSignIn?.(signinEmail.trim(), signinPassword);
      toast.success("Signed in successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error("Please complete all fields.");
      return;
    }
    if (Object.keys(signupErrors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      setAuthLoading(true);
      await onSignUp?.(signupName.trim(), signupEmail.trim(), signupPassword);
      toast.success("Account created. Welcome!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create account.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email.");
      return;
    }
    if (Object.keys(resetErrors).length) {
      toast.error("Please enter a valid email.");
      return;
    }
    try {
      setAuthLoading(true);
      await onResetPassword?.(resetEmail.trim());
      toast.success("If an account exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Settings/Security states (local mirrors; send via onUpdateProfile)
  const [localName, setLocalName] = useState(user?.name ?? "");
  const [localOrg, setLocalOrg] = useState(user?.organization ?? "");
  const [localRole, setLocalRole] = useState(user?.role ?? "");
  const [localPrefs, setLocalPrefs] = useState<UserProfileData["preferences"]>({
    emailAlerts: user?.preferences?.emailAlerts ?? true,
    productUpdates: user?.preferences?.productUpdates ?? true,
    compactMode: user?.preferences?.compactMode ?? false,
    analyticsConsent: user?.preferences?.analyticsConsent ?? true,
    language: user?.preferences?.language ?? "en",
  });

  useEffect(() => {
    setLocalName(user?.name ?? "");
    setLocalOrg(user?.organization ?? "");
    setLocalRole(user?.role ?? "");
    setLocalPrefs({
      emailAlerts: user?.preferences?.emailAlerts ?? true,
      productUpdates: user?.preferences?.productUpdates ?? true,
      compactMode: user?.preferences?.compactMode ?? false,
      analyticsConsent: user?.preferences?.analyticsConsent ?? true,
      language: user?.preferences?.language ?? "en",
    });
  }, [user?.name, user?.organization, user?.role, user?.preferences]);

  async function saveProfile() {
    try {
      await onUpdateProfile?.({
        name: localName,
        organization: localOrg,
        role: localRole,
        preferences: localPrefs,
      });
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    }
  }

  async function exportData() {
    try {
      await onExportData?.();
      toast.success("Export started. You'll be notified when ready.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export data.");
    }
  }

  async function toggleMfa(next: boolean) {
    try {
      await onToggleMfa?.(next);
      toast.success(next ? "Multi-factor authentication enabled." : "Multi-factor authentication disabled.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update MFA.");
    }
  }

  async function revokeSessions() {
    try {
      await onRevokeSessions?.();
      toast.success("All other sessions have been revoked.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke sessions.");
    }
  }

  async function deleteAccount() {
    try {
      await onDeleteAccount?.();
      toast.success("Account deletion initiated.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account.");
    }
  }

  const authedTabs = (
    <TabsList className="w-full overflow-x-auto justify-start">
      <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
      <TabsTrigger value="queries">Saved Queries</TabsTrigger>
      <TabsTrigger value="favorites">Favorite Regions</TabsTrigger>
      <TabsTrigger value="downloads">Downloads</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
      <TabsTrigger value="security">Security</TabsTrigger>
      <TabsTrigger value="privacy">Privacy</TabsTrigger>
      <TabsTrigger value="activity">Activity</TabsTrigger>
    </TabsList>
  );

  const authTabs = (
    <TabsList className="w-full overflow-x-auto justify-start">
      <TabsTrigger value="signin">Sign In</TabsTrigger>
      <TabsTrigger value="signup">Create Account</TabsTrigger>
      <TabsTrigger value="reset">Reset Password</TabsTrigger>
    </TabsList>
  );

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-lg border bg-card text-foreground shadow-sm",
        className
      )}
      style={style}
      aria-label="User profile and authentication"
    >
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <SectionHeader
            icon={
              isAuthed ? (
                <UserRoundCheck className="h-5 w-5" aria-hidden />
              ) : (
                <LogIn className="h-5 w-5" aria-hidden />
              )
            }
            title={isAuthed ? "Account" : "Welcome to Eagle Vision"}
            desc={
              isAuthed
                ? "Manage your profile, preferences, security, and activity."
                : "Sign in or create an account to save queries, manage regions, and export reports."
            }
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          {isAuthed ? authedTabs : authTabs}

          {/* Unauthenticated: Sign In */}
          <TabsContent value="signin" className="mt-4 focus-visible:outline-none">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Sign in to your account</CardTitle>
                <CardDescription>Access your saved data and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                  <Field
                    label="Email"
                    htmlFor="signin-email"
                    required
                    message={signinErrors.email}
                  >
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@company.com"
                      inputMode="email"
                      autoComplete="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      aria-invalid={!!signinErrors.email}
                      className="bg-background"
                    />
                  </Field>
                  <Field
                    label="Password"
                    htmlFor="signin-password"
                    required
                    message={signinErrors.password}
                  >
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      aria-invalid={!!signinErrors.password}
                      className="bg-background"
                    />
                  </Field>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm text-muted-foreground">
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-sm"
                      onClick={() => setActiveTab("reset")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={authLoading}
                  >
                    {authLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unauthenticated: Sign Up */}
          <TabsContent value="signup" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Create your account</CardTitle>
                <CardDescription>Join Eagle Vision to unlock full features.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                  <Field
                    label="Full name"
                    htmlFor="signup-name"
                    required
                    message={signupErrors.name}
                  >
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jane Doe"
                      autoComplete="name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      aria-invalid={!!signupErrors.name}
                      className="bg-background"
                    />
                  </Field>
                  <Field
                    label="Email"
                    htmlFor="signup-email"
                    required
                    message={signupErrors.email}
                  >
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@company.com"
                      inputMode="email"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      aria-invalid={!!signupErrors.email}
                      className="bg-background"
                    />
                  </Field>
                  <Field
                    label="Password"
                    htmlFor="signup-password"
                    required
                    description="Use at least 8 characters with letters and numbers."
                    message={signupErrors.password}
                  >
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        aria-invalid={!!signupErrors.password}
                        className="bg-background pr-10"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                        <Key className="h-4 w-4" aria-hidden />
                      </div>
                    </div>
                  </Field>
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-6">
                      I agree to the Terms and Privacy Policy.
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unauthenticated: Password Reset */}
          <TabsContent value="reset" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Reset your password</CardTitle>
                <CardDescription>We’ll send you a secure reset link.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReset} className="space-y-4" noValidate>
                  <Field
                    label="Email"
                    htmlFor="reset-email"
                    required
                    message={resetErrors.email}
                  >
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@company.com"
                      inputMode="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      aria-invalid={!!resetErrors.email}
                      className="bg-background"
                    />
                  </Field>
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveTab("signin")}
                    >
                      Back to Sign In
                    </Button>
                    <Button type="submit" disabled={authLoading}>
                      {authLoading ? "Sending..." : "Send reset link"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Dashboard */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="grid gap-4">
              <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <CircleUser className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{user?.name || user?.email}</CardTitle>
                      <CardDescription className="break-words">{user?.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {user?.role || "Member"}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-md border bg-secondary/30 p-3">
                      <div className="text-sm text-muted-foreground">Saved Queries</div>
                      <div className="mt-1 text-2xl font-semibold">{savedQueries.length}</div>
                    </div>
                    <div className="rounded-md border bg-secondary/30 p-3">
                      <div className="text-sm text-muted-foreground">Favorite Regions</div>
                      <div className="mt-1 text-2xl font-semibold">{favoriteRegions.length}</div>
                    </div>
                    <div className="rounded-md border bg-secondary/30 p-3">
                      <div className="text-sm text-muted-foreground">Downloads</div>
                      <div className="mt-1 text-2xl font-semibold">{downloads.length}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setActiveTab("queries")} className="gap-2">
                      <UserCog className="h-4 w-4" aria-hidden />
                      Manage Data
                    </Button>
                    <Button variant="secondary" onClick={() => setActiveTab("settings")} className="gap-2">
                      <UserPen className="h-4 w-4" aria-hidden />
                      Edit Profile
                    </Button>
                    <Button variant="default" onClick={exportData} className="gap-2">
                      <KeyRound className="h-4 w-4" aria-hidden />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <CardDescription>Latest account events.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activity.length === 0 ? (
                      <EmptyState
                        title="No recent activity"
                        description="Your latest sign-ins, exports, and updates will appear here."
                        icon={<IdCard className="h-5 w-5" aria-hidden />}
                      />
                    ) : (
                      <ul className="space-y-3">
                        {activity.slice(0, 6).map((a) => (
                          <li key={a.id} className="flex items-start gap-3">
                            <div className="mt-0.5 text-muted-foreground">
                              {a.type === "login" ? (
                                <User className="h-4 w-4" aria-hidden />
                              ) : a.type === "export" ? (
                                <KeyRound className="h-4 w-4" aria-hidden />
                              ) : a.type === "security" ? (
                                <ShieldUser className="h-4 w-4" aria-hidden />
                              ) : a.type === "preference" ? (
                                <UserCog className="h-4 w-4" aria-hidden />
                              ) : (
                                <IdCard className="h-4 w-4" aria-hidden />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm break-words">{a.detail}</p>
                              <p className="text-xs text-muted-foreground">{a.at}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Security Status</CardTitle>
                    <CardDescription>Keep your account protected.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Multi-factor authentication</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.security?.mfaEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <Badge variant={user?.security?.mfaEnabled ? "secondary" : "outline"}>
                        {user?.security?.mfaEnabled ? "On" : "Off"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active sessions</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.security?.sessions ?? 1} device(s)
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={revokeSessions}>
                        Revoke others
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Last password change</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.security?.lastPasswordChange || "Unknown"}
                        </p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("security")}>
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Authenticated: Saved Queries */}
          <TabsContent value="queries" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Saved Queries</CardTitle>
                <CardDescription>Your natural language and map queries.</CardDescription>
              </CardHeader>
              <CardContent>
                {savedQueries.length === 0 ? (
                  <EmptyState
                    title="No saved queries"
                    description="Save queries from the analysis pages to revisit them here."
                    icon={<UserCog className="h-5 w-5" aria-hidden />}
                    cta={
                      <Button variant="secondary" onClick={() => toast.info("Navigate to analysis to save queries.")}>
                        Explore analysis
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {savedQueries.map((q) => (
                      <li
                        key={q.id}
                        className="rounded-md border bg-secondary/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{q.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground break-words line-clamp-2">
                              {q.query}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Updated {q.updatedAt}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success("Query loaded into workspace.")}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await onRemoveSavedQuery?.(q.id);
                                  toast.success("Removed.");
                                } catch (e: any) {
                                  toast.error(e?.message || "Failed to remove.");
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Favorite Regions */}
          <TabsContent value="favorites" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Favorite Regions</CardTitle>
                <CardDescription>Quick access to your areas of interest.</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteRegions.length === 0 ? (
                  <EmptyState
                    title="No favorite regions"
                    description="Mark regions as favorites from the map to find them here."
                    icon={<IdCard className="h-5 w-5" aria-hidden />}
                  />
                ) : (
                  <ul className="space-y-3">
                    {favoriteRegions.map((r) => (
                      <li key={r.id} className="rounded-md border bg-secondary/30 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.name}</p>
                            {r.description ? (
                              <p className="mt-1 text-sm text-muted-foreground break-words line-clamp-2">
                                {r.description}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">Updated {r.updatedAt}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.info("Opening region in map...")}
                            >
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await onRemoveFavorite?.(r.id);
                                  toast.success("Removed from favorites.");
                                } catch (e: any) {
                                  toast.error(e?.message || "Failed to remove.");
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Downloads */}
          <TabsContent value="downloads" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Downloaded Reports</CardTitle>
                <CardDescription>Access your exported reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {downloads.length === 0 ? (
                  <EmptyState
                    title="No downloads yet"
                    description="Generate reports from analysis to see them here."
                    icon={<KeyRound className="h-5 w-5" aria-hidden />}
                  />
                ) : (
                  <ul className="space-y-3">
                    {downloads.map((d) => (
                      <li key={d.id} className="rounded-md border bg-secondary/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{d.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {d.format.toUpperCase()} • {d.sizeMB.toFixed(1)} MB • {d.createdAt}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await onDownloadReport?.(d.id);
                                  toast.success("Download started.");
                                } catch (e: any) {
                                  toast.error(e?.message || "Failed to download.");
                                }
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Settings */}
          <TabsContent value="settings" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Account Settings</CardTitle>
                <CardDescription>Update your profile and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <SectionHeader
                    icon={<UserPen className="h-5 w-5" aria-hidden />}
                    title="Profile"
                    desc="Your public and organizational information."
                  />
                  <div className="grid gap-4">
                    <Field label="Full name" htmlFor="profile-name" orientation="horizontal">
                      <Input
                        id="profile-name"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        className="bg-background"
                      />
                    </Field>
                    <Field label="Organization" htmlFor="profile-org" orientation="horizontal">
                      <Input
                        id="profile-org"
                        value={localOrg}
                        onChange={(e) => setLocalOrg(e.target.value)}
                        className="bg-background"
                      />
                    </Field>
                    <Field label="Role" htmlFor="profile-role" orientation="horizontal">
                      <Input
                        id="profile-role"
                        value={localRole}
                        onChange={(e) => setLocalRole(e.target.value)}
                        className="bg-background"
                      />
                    </Field>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <SectionHeader
                    icon={<UserCog className="h-5 w-5" aria-hidden />}
                    title="Preferences"
                    desc="Control notifications and interface options."
                  />
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Email alerts</p>
                        <p className="text-xs text-muted-foreground">Receive notifications for activity and reports.</p>
                      </div>
                      <Switch
                        checked={localPrefs.emailAlerts}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, emailAlerts: v }))}
                        aria-label="Toggle email alerts"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Product updates</p>
                        <p className="text-xs text-muted-foreground">Occasional announcements about new features.</p>
                      </div>
                      <Switch
                        checked={localPrefs.productUpdates}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, productUpdates: v }))}
                        aria-label="Toggle product updates"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Compact mode</p>
                        <p className="text-xs text-muted-foreground">Denser spacing for information-heavy screens.</p>
                      </div>
                      <Switch
                        checked={localPrefs.compactMode}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, compactMode: v }))}
                        aria-label="Toggle compact mode"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Analytics consent</p>
                        <p className="text-xs text-muted-foreground">Help us improve with anonymous usage data.</p>
                      </div>
                      <Switch
                        checked={localPrefs.analyticsConsent}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, analyticsConsent: v }))}
                        aria-label="Toggle analytics consent"
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 sm:gap-6 items-center">
                      <Label htmlFor="language" className="text-sm">Language</Label>
                      <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(["en", "es", "fr", "de"] as const).map((lang) => (
                          <Button
                            key={lang}
                            type="button"
                            variant={localPrefs.language === lang ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setLocalPrefs((p) => ({ ...p, language: lang }))}
                            aria-pressed={localPrefs.language === lang}
                          >
                            {lang.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setLocalName(user?.name ?? "");
                    setLocalOrg(user?.organization ?? "");
                    setLocalRole(user?.role ?? "");
                    setLocalPrefs({
                      emailAlerts: user?.preferences?.emailAlerts ?? true,
                      productUpdates: user?.preferences?.productUpdates ?? true,
                      compactMode: user?.preferences?.compactMode ?? false,
                      analyticsConsent: user?.preferences?.analyticsConsent ?? true,
                      language: user?.preferences?.language ?? "en",
                    });
                    toast.info("Changes discarded.");
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={saveProfile}>Save changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Security */}
          <TabsContent value="security" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>Protect your account and manage access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <SectionHeader
                    icon={<ShieldUser className="h-5 w-5" aria-hidden />}
                    title="Multi-factor authentication (MFA)"
                    desc="Add an extra layer of security at sign-in."
                  />
                  <div className="flex items-start justify-between gap-3 rounded-md border bg-secondary/30 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">MFA</p>
                      <p className="text-xs text-muted-foreground">
                        Use an authenticator app to generate one-time codes.
                      </p>
                    </div>
                    <Switch
                      checked={!!user?.security?.mfaEnabled}
                      onCheckedChange={toggleMfa}
                      aria-label="Toggle MFA"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeader
                    icon={<Key className="h-5 w-5" aria-hidden />}
                    title="Password"
                    desc="Update your password regularly."
                  />
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success("Password updated.");
                    }}
                  >
                    <Field label="Current password" htmlFor="pwd-current" orientation="horizontal">
                      <Input id="pwd-current" type="password" autoComplete="current-password" className="bg-background" />
                    </Field>
                    <Field label="New password" htmlFor="pwd-new" orientation="horizontal" description="Use 8+ chars with letters and numbers.">
                      <Input id="pwd-new" type="password" autoComplete="new-password" className="bg-background" />
                    </Field>
                    <Field label="Confirm new password" htmlFor="pwd-confirm" orientation="horizontal">
                      <Input id="pwd-confirm" type="password" autoComplete="new-password" className="bg-background" />
                    </Field>
                    <div className="flex items-center justify-end">
                      <Button type="submit">Update password</Button>
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <SectionHeader
                    icon={<Fingerprint className="h-5 w-5" aria-hidden />}
                    title="Sessions"
                    desc="Sign out from other devices."
                  />
                  <div className="flex items-center justify-between gap-3 rounded-md border bg-secondary/30 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Active sessions</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.security?.sessions ?? 1} device(s) signed in.
                      </p>
                    </div>
                    <Button variant="outline" onClick={revokeSessions}>
                      Revoke others
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <SectionHeader
                    icon={<UserLock className="h-5 w-5" aria-hidden />}
                    title="Danger zone"
                    desc="Irreversible or high-impact actions."
                  />
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={exportData}
                    >
                      <KeyRound className="h-4 w-4" aria-hidden />
                      Export account data
                    </Button>
                    <Button
                      variant="destructive"
                      className="justify-start gap-2"
                      onClick={deleteAccount}
                    >
                      <UserLock className="h-4 w-4" aria-hidden />
                      Delete account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Privacy */}
          <TabsContent value="privacy" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Privacy Controls</CardTitle>
                <CardDescription>Manage what we collect and how it’s used.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3 rounded-md border bg-secondary/30 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">
                      Share anonymous usage data to improve Eagle Vision.
                    </p>
                  </div>
                  <Switch
                    checked={!!localPrefs.analyticsConsent}
                    onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, analyticsConsent: v }))}
                    aria-label="Toggle analytics"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-md border bg-secondary/30 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Email communications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive service announcements and updates.
                    </p>
                  </div>
                  <Switch
                    checked={!!localPrefs.productUpdates}
                    onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, productUpdates: v }))}
                    aria-label="Toggle product emails"
                  />
                </div>
                <div>
                  <Label htmlFor="privacy-requests" className="text-sm">Data requests</Label>
                  <Textarea
                    id="privacy-requests"
                    placeholder="Request data access, correction, or deletion..."
                    className="mt-2 bg-background"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => toast.success("Request submitted. We'll respond shortly.")}
                    >
                      Submit request
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setLocalPrefs((p) => ({ ...p, analyticsConsent: true, productUpdates: true }));
                    toast.info("Privacy defaults restored.");
                  }}>
                    Restore defaults
                  </Button>
                  <Button onClick={saveProfile}>Save changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authenticated: Activity */}
          <TabsContent value="activity" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Activity History</CardTitle>
                <CardDescription>Comprehensive log of account actions.</CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    description="Your sign-ins, changes, and exports will appear here."
                    icon={<User className="h-5 w-5" aria-hidden />}
                  />
                ) : (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 rounded-md border bg-secondary/30 p-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {a.type === "login" ? (
                            <User className="h-4 w-4" aria-hidden />
                          ) : a.type === "export" ? (
                            <KeyRound className="h-4 w-4" aria-hidden />
                          ) : a.type === "security" ? (
                            <ShieldUser className="h-4 w-4" aria-hidden />
                          ) : a.type === "preference" ? (
                            <UserCog className="h-4 w-4" aria-hidden />
                          ) : (
                            <IdCard className="h-4 w-4" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm break-words">{a.detail}</p>
                          <p className="text-xs text-muted-foreground">{a.at}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}