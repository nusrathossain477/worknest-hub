import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Users, Clock, LogOut, UserCircle, MapPin, Phone, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCompanySettings } from "@/hooks/use-company";
import { NotificationsBell } from "./NotificationsBell";
import logo from "@/assets/worknest-logo.png.asset.json";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const { settings } = useCompanySettings();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tasks", label: "Tasks", icon: ListChecks },
    { to: "/attendance", label: "Attendance", icon: Clock },
    { to: "/profile", label: "Profile", icon: UserCircle },
    ...(role === "admin" ? [{ to: "/team", label: "Team", icon: Users }] : []),
  ];


  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex min-h-20 items-center gap-3 px-5 py-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-foreground/10 p-1">
            <img src={logo.url} alt="WorkNest logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="font-semibold leading-tight">WorkNest</div>
            <div className="text-xs capitalize text-sidebar-foreground/60">{role}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-primary-foreground" : "hover:bg-sidebar-accent/60"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2 border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/70">
          <div className="font-semibold uppercase tracking-wide text-sidebar-foreground/50">
            {settings?.company_name || "WorkNest"} · Help &amp; Contact
          </div>
          {settings?.address && (
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="leading-snug">{settings.address}</span>
            </div>
          )}
          {settings?.helpline && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${settings.helpline.replace(/\s/g, "")}`} className="hover:underline">
                {settings.helpline}
              </a>
            </div>
          )}
          {settings?.support_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a href={`mailto:${settings.support_email}`} className="truncate hover:underline">
                {settings.support_email}
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-sidebar-border p-3">

          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">{initials}</div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium">{profile?.full_name || "User"}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{profile?.email}</div>
            </div>
            <button onClick={onSignOut} title="Sign out"
              className="rounded-md p-2 hover:bg-sidebar-accent">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src={logo.url} alt="WorkNest logo" className="h-8 w-auto max-w-[40px] shrink-0 object-contain" />
            <span className="font-semibold">WorkNest</span>
          </div>
          <div className="hidden md:block">
            <h2 className="text-sm text-muted-foreground">Welcome back,</h2>
            <p className="font-semibold">{profile?.full_name || "there"}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button onClick={onSignOut} className="rounded-md p-2 hover:bg-muted md:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="flex border-t bg-card md:hidden">
          {nav.map((item) => {
            const active = path === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${active ? "text-accent" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
