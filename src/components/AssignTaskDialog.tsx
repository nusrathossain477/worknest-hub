import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole, Profile, TaskPriority } from "@/lib/types";
import { X, Search } from "lucide-react";
import { toast } from "sonner";


interface MemberRow extends Profile { role: AppRole }

export function AssignTaskDialog({
  members, onClose, onCreated,
}: { members: MemberRow[]; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const assignable = members.filter((m) => m.role !== "admin");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(assignable[0]?.id ?? "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [due, setDue] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [skillsBy, setSkillsBy] = useState<Record<string, string[]>>({});
  const [openTasks, setOpenTasks] = useState<Record<string, number>>({});
  const [overdue, setOverdue] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: tk }] = await Promise.all([
        supabase.from("profile_skills").select("user_id, proficiency, skill:skills(name)"),
        supabase.from("tasks").select("assigned_to, status, due_date"),
      ]);
      const sk: Record<string, string[]> = {};
      ((ps as any[]) ?? []).forEach((r) => {
        const name = r.skill?.name;
        if (!name) return;
        (sk[r.user_id] ??= []).push(`${name} ${"★".repeat(r.proficiency)}`);
      });
      const open: Record<string, number> = {};
      const late: Record<string, number> = {};
      const now = Date.now();
      ((tk as any[]) ?? []).forEach((t) => {
        if (t.status === "completed") return;
        open[t.assigned_to] = (open[t.assigned_to] ?? 0) + 1;
        if (new Date(t.due_date).getTime() < now && t.status !== "submitted") {
          late[t.assigned_to] = (late[t.assigned_to] ?? 0) + 1;
        }
      });
      setSkillsBy(sk);
      setOpenTasks(open);
      setOverdue(late);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignable;
    return assignable.filter((m) => {
      const hay = [
        m.full_name, m.email, m.designation, m.department, m.role,
        ...(skillsBy[m.id] ?? []),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, members, skillsBy]);



  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !assignedTo) return;
    const target = assignable.find((m) => m.id === assignedTo);
    if (!target) return;

    setBusy(true);
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title, description,
        assigned_to: assignedTo,
        assigned_by: user.id,
        target_role: target.role,
        priority,
        due_date: new Date(due).toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !task) { toast.error(error?.message ?? "Failed to assign"); setBusy(false); return; }

    await supabase.from("notifications").insert({
      user_id: assignedTo,
      title: "New task assigned",
      message: title,
      related_task_id: task.id,
    });

    toast.success("Task assigned");
    setBusy(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assign a new task</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Description">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Assign to">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, skill, department…"
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
              {filtered.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No matching employees or staff.</p>
              )}
              {filtered.map((m) => {
                const selected = assignedTo === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setAssignedTo(m.id)}
                    className={`w-full rounded-md p-2 text-left transition ${selected ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{m.full_name || m.email}</span>
                      <span className="text-[11px] capitalize text-muted-foreground">{m.role}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {[m.designation, m.department].filter(Boolean).join(" · ") || "No designation set"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {(skillsBy[m.id] ?? []).slice(0, 4).map((s) => (
                        <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{s}</span>
                      ))}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {openTasks[m.id] ?? 0} open
                        {overdue[m.id] ? ` · ${overdue[m.id]} overdue` : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Due date">
              <input type="datetime-local" required value={due} onChange={(e) => setDue(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={busy || !assignedTo}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {busy ? "Assigning…" : "Assign task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
