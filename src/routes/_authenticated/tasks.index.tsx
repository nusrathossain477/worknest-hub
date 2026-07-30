import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task, Profile, AppRole } from "@/lib/types";
import { TaskCard } from "@/components/TaskCard";
import { AssignTaskDialog } from "@/components/AssignTaskDialog";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks/")({
  component: TasksPage,
});

interface MemberRow extends Profile { role: AppRole }

function TasksPage() {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "submitted" | "completed">("active");
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("tasks").select("*").order("due_date", { ascending: true });
    if (role !== "admin") q = q.eq("assigned_to", user.id);
    const { data } = await q;
    setTasks((data as Task[]) ?? []);

    if (role === "admin") {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
      setMembers(((profs as Profile[]) ?? []).map((p) => ({ ...p, role: (map.get(p.id) as AppRole) ?? "staff" })));
    }
  };

  useEffect(() => { load(); }, [user?.id, role]);

  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "active") return t.status === "pending" || t.status === "in_progress";
    if (filter === "submitted") return t.status === "submitted";
    return t.status === "completed";
  });

  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{role === "admin" ? "All tasks across the company" : "Your assigned work"}</p>
        </div>
        {role === "admin" && (
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Assign task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["active", "submitted", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          No tasks here.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((t) => <TaskCard key={t.id} task={t} assigneeName={memberById.get(t.assigned_to)?.full_name} />)}
        </div>
      )}

      {open && role === "admin" && (
        <AssignTaskDialog members={members} onClose={() => setOpen(false)} onCreated={load} />
      )}
    </div>
  );
}
