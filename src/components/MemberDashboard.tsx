import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task } from "@/lib/types";
import { ListChecks, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { Link } from "@tanstack/react-router";

export function MemberDashboard() {
  const { user, profile, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from("tasks").select("*").eq("assigned_to", user.id).order("due_date", { ascending: true }),
      supabase.from("attendance").select("check_in").eq("user_id", user.id).eq("work_date", today).order("check_in", { ascending: false }).limit(1),
    ]);
    setTasks((t as Task[]) ?? []);
    setTodayCheckIn(a?.[0]?.check_in ?? null);
  };

  useEffect(() => { load(); }, [user?.id]);

  const now = new Date();
  const active = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const submitted = tasks.filter((t) => t.status === "submitted" || t.status === "completed");
  const overdue = active.filter((t) => new Date(t.due_date) < now);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hi {profile?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-sm capitalize text-muted-foreground">Your {role} workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Clock} label="Checked in"
          value={todayCheckIn ? new Date(todayCheckIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          tone="primary" />
        <Stat icon={ListChecks} label="Active tasks" value={String(active.length)} tone="warning" />
        <Stat icon={CheckCircle2} label="Submitted" value={String(submitted.length)} tone="success" />
        <Stat icon={AlertTriangle} label="Overdue" value={String(overdue.length)} tone="destructive" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your active work</h2>
          <Link to="/tasks" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        {active.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            All caught up — no active tasks.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {active.slice(0, 6).map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </section>

      {submitted.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recently submitted</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {submitted.slice(0, 4).map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}
