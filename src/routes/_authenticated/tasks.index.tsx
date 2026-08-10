import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task } from "@/lib/types";
import { fetchVisibleMembers, type MemberRow } from "@/lib/members";
import { TaskCard } from "@/components/TaskCard";
import { AssignTaskDialog } from "@/components/AssignTaskDialog";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks/")({
  component: TasksPage,
});

function TasksPage() {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "submitted" | "completed">("active");
  const [open, setOpen] = useState(false);

  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const canAssign = isAdmin || isEmployee;

  const load = async () => {
    if (!user) return;
    let q = supabase.from("tasks").select("*").order("due_date", { ascending: true });
    if (!isAdmin) q = q.or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`);
    const { data } = await q;
    setTasks((data as Task[]) ?? []);

    if (canAssign) setMembers(await fetchVisibleMembers());
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
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "All tasks across the company"
              : isEmployee
                ? "Your work plus the tasks you delegated to staff"
                : "Your assigned work"}
          </p>
        </div>
        {canAssign && (
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {isEmployee ? "Delegate to staff" : "Assign task"}
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
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} assigneeName={memberById.get(t.assigned_to)?.full_name} />
          ))}
        </div>
      )}

      {open && canAssign && (
        <AssignTaskDialog
          members={members}
          mode={isEmployee ? "employee" : "admin"}
          onClose={() => setOpen(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
