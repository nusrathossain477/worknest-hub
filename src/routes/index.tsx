import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Briefcase, Users, ClipboardList, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/worknest-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logo.url} alt="WorkNest logo" className="h-10 w-auto max-w-[48px] object-contain" />
            <span className="text-lg font-semibold">WorkNest</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Sign in</Link>
            <Link to="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Get started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <section className="text-center">
          <p className="text-sm font-medium text-accent">Smart Company Management</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Run your company from one nest.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Assign work, track attendance, share progress, and give feedback — without endless meetings or paperwork.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create account</Link>
            <Link to="/login" className="rounded-md border px-6 py-3 text-sm font-semibold hover:bg-muted">Sign in</Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Role-based access", desc: "Admin, employee and staff dashboards tailored to each role." },
            { icon: Briefcase, title: "Task assignment", desc: "Assign work with due dates and priority. Track every step." },
            { icon: ClipboardList, title: "Auto attendance", desc: "Check-in on login, check-out on logout. Zero hassle." },
            { icon: Users, title: "Feedback loop", desc: "Comment on submissions and keep records secure forever." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
