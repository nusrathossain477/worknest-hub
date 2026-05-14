import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task, TaskUpdate, TaskFeedback, Profile, TaskStatus, UpdateType } from "@/lib/types";
import { ArrowLeft, Send, MessageSquare, HelpCircle, Star } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [feedback, setFeedback] = useState<TaskFeedback[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());

  const [message, setMessage] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType>("progress");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState<number>(5);

  const load = async () => {
    const [{ data: t }, { data: u }, { data: f }] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", taskId).maybeSingle(),
      supabase.from("task_updates").select("*").eq("task_id", taskId).order("created_at", { ascending: true }),
      supabase.from("task_feedback").select("*").eq("task_id", taskId).order("created_at", { ascending: false }),
    ]);
    setTask((t as Task) ?? null);
    setUpdates((u as TaskUpdate[]) ?? []);
    setFeedback((f as TaskFeedback[]) ?? []);

    const ids = new Set<string>();
    if (t) { ids.add((t as Task).assigned_to); ids.add((t as Task).assigned_by); }
    (u ?? []).forEach((row: any) => ids.add(row.user_id));
    (f ?? []).forEach((row: any) => ids.add(row.admin_id));
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
      setProfilesMap(new Map((profs ?? []).map((p: any) => [p.id, p])));
    }
  };

  useEffect(() => { load(); }, [taskId]);

  if (!task) return <div className="text-muted-foreground">Loading…</div>;

  const isAssignee = task.assigned_to === user?.id;
  const isAdmin = role === "admin";
  const due = new Date(task.due_date);
  const overdue = (task.status === "pending" || task.status === "in_progress") && due < new Date();

  const updateStatus = async (newStatus: TaskStatus) => {
    const patch: any = { status: newStatus };
    if (newStatus === "submitted") {
      const submittedAt = new Date();
      patch.submitted_at = submittedAt.toISOString();
      if (submittedAt > due) patch.status = "late";
    }
    const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
    if (error) { toast.error(error.message); return; }
    if (newStatus === "submitted") {
      await supabase.from("notifications").insert({
        user_id: task.assigned_by,
        title: patch.status === "late" ? "Task submitted (late)" : "Task submitted",
        message: task.title,
        related_task_id: task.id,
      });
    }
    toast.success("Updated");
    load();
  };

  const postUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    const { error } = await supabase.from("task_updates").insert({
      task_id: task.id, user_id: user.id, message, update_type: updateType,
    });
    if (error) { toast.error(error.message); return; }
    if (updateType === "request") {
      await supabase.from("notifications").insert({
        user_id: task.assigned_by,
        title: "Resource / help request",
        message: `${task.title}: ${message.slice(0, 80)}`,
        related_task_id: task.id,
      });
    }
    setMessage("");
    load();
  };

  const postFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !feedbackText.trim()) return;
    const { error } = await supabase.from("task_feedback").insert({
      task_id: task.id, admin_id: user.id, comment: feedbackText, rating,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("tasks").update({ status: "completed" }).eq("id", task.id);
    await supabase.from("notifications").insert({
      user_id: task.assigned_to,
      title: "Feedback received",
      message: task.title,
      related_task_id: task.id,
    });
    setFeedbackText("");
    toast.success("Feedback sent");
    load();
  };

  const statusLabel = overdue ? "late" : task.status;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate({ to: "/tasks" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </button>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Assigned by {profilesMap.get(task.assigned_by)?.full_name || "Admin"} · to {profilesMap.get(task.assigned_to)?.full_name || "—"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge(statusLabel)}`}>
            {statusLabel.replace("_", " ")}
          </span>
        </div>
        {task.description && <p className="mt-4 whitespace-pre-wrap text-sm">{task.description}</p>}

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Priority" value={task.priority} />
          <Info label="Due" value={`${format(due, "MMM d, p")} (${formatDistanceToNow(due, { addSuffix: true })})`} />
          <Info label="Submitted" value={task.submitted_at ? format(new Date(task.submitted_at), "MMM d, p") : "—"} />
        </dl>

        {/* Status actions for assignee */}
        {isAssignee && task.status !== "completed" && (
          <div className="mt-5 flex flex-wrap gap-2">
            {task.status === "pending" && (
              <button onClick={() => updateStatus("in_progress")} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Start working</button>
            )}
            {(task.status === "pending" || task.status === "in_progress") && (
              <button onClick={() => updateStatus("submitted")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Submit for review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Updates / requests */}
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Activity & requests</h2>
        <div className="mt-4 space-y-3">
          {updates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
          {updates.map((u) => (
            <div key={u.id} className={`rounded-lg border-l-4 p-3 ${u.update_type === "request" ? "border-warning bg-warning/5" : "border-accent bg-accent/5"}`}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {profilesMap.get(u.user_id)?.full_name || "User"}
                </span>
                <span className="inline-flex items-center gap-1">
                  {u.update_type === "request" ? <HelpCircle className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {u.update_type === "request" ? "Request" : "Update"} · {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{u.message}</p>
            </div>
          ))}
        </div>

        {isAssignee && task.status !== "completed" && (
          <form onSubmit={postUpdate} className="mt-5 space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => setUpdateType("progress")}
                className={`rounded-md px-3 py-1 text-xs ${updateType === "progress" ? "bg-accent text-accent-foreground" : "border"}`}>
                Progress note
              </button>
              <button type="button" onClick={() => setUpdateType("request")}
                className={`rounded-md px-3 py-1 text-xs ${updateType === "request" ? "bg-warning text-warning-foreground" : "border"}`}>
                Need help / request
              </button>
            </div>
            <div className="flex gap-2">
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                placeholder={updateType === "request" ? "What do you need? (e.g. access to design files, more time, clarification)" : "Share your progress…"}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button type="submit" className="self-end rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Feedback */}
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Admin feedback</h2>
        <div className="mt-4 space-y-3">
          {feedback.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
          {feedback.map((f) => (
            <div key={f.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{profilesMap.get(f.admin_id)?.full_name || "Admin"}</span>
                <span>{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span>
              </div>
              {f.rating != null && (
                <div className="mt-1 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < (f.rating ?? 0) ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                  ))}
                </div>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm">{f.comment}</p>
            </div>
          ))}
        </div>

        {isAdmin && (task.status === "submitted" || task.status === "late") && (
          <form onSubmit={postFeedback} className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Rating:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <button type="button" key={i} onClick={() => setRating(i + 1)}>
                  <Star className={`h-5 w-5 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <textarea required value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={3}
              placeholder="Comment on the work, suggest improvements…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex justify-end">
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Send feedback & complete
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 capitalize">{value}</dd>
    </div>
  );
}

function badge(s: string) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    in_progress: "bg-warning/20 text-warning-foreground",
    submitted: "bg-accent/15 text-accent-foreground",
    completed: "bg-success/15 text-success-foreground",
    late: "bg-destructive/15 text-destructive",
  };
  return map[s] ?? "bg-muted";
}
