import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task } from "@/lib/types";
import { fetchVisibleMembers, type MemberRow } from "@/lib/members";
import { Plus, Users, ListChecks, CheckCircle2, AlertTriangle } from "lucide-react";
import { AssignTaskDialog } from "./AssignTaskDialog";
import { TaskCard } from "./TaskCard";
import { RoleBadge } from "./RoleBadge";
import { Link } from "@tanstack/react-router";

export function AdminDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [{ data: t }, people] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      fetchVisibleMembers(),
    ]);
    setTasks((t as Task[]) ?? []);
    setMembers(people);
  };

  useEffect(() => { load(); }, [user?.id]);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    late: tasks.filter((t) => t.status === "late" || (t.status !== "completed" && t.status !== "submitted" && new Date(t.due_date) < new Date())).length,
  };

  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin overview</h1>
          <p className="text-sm text-muted-foreground">Assign work, monitor progress, give feedback.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Assign task
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ListChecks} label="Total tasks" value={stats.total} tone="primary" />
        <Stat icon={Users} label="In progress" value={stats.pending} tone="warning" />
        <Stat icon={CheckCircle2} label="Submitted" value={stats.submitted} tone="success" />
        <Stat icon={AlertTriangle} label="Overdue / late" value={stats.late} tone="destructive" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent tasks</h2>
          <Link to="/tasks" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        {tasks.length === 0 ? (
          <EmptyState message="No tasks yet — assign your first one." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {tasks.slice(0, 6).map((t) => (
              <TaskCard key={t.id} task={t} assigneeName={memberById.get(t.assigned_to)?.full_name || "—"} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Team ({members.length})</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">{m.full_name || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-2"><RoleBadge role={m.role} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && <AssignTaskDialog members={members} onClose={() => setOpen(false)} onCreated={load} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
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
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}



function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">{message}</div>;
}
