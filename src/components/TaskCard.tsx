import { Link } from "@tanstack/react-router";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Calendar, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const priorityStyle: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/15 text-accent-foreground",
  high: "bg-warning/20 text-warning-foreground",
  urgent: "bg-destructive/15 text-destructive",
};

const statusStyle: Record<TaskStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning-foreground",
  submitted: "bg-accent/15 text-accent-foreground",
  completed: "bg-success/15 text-success-foreground",
  late: "bg-destructive/15 text-destructive",
};

export function TaskCard({ task, assigneeName }: { task: Task; assigneeName?: string }) {
  const due = new Date(task.due_date);
  const overdue = (task.status === "pending" || task.status === "in_progress") && due < new Date();

  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.id }}
      className="block rounded-xl border bg-card p-5 transition hover:border-accent hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityStyle[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${statusStyle[overdue ? "late" : task.status]}`}>
          {(overdue ? "late" : task.status).replace("_", " ")}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(due, "MMM d, p")} · {formatDistanceToNow(due, { addSuffix: true })}
        </span>
        {assigneeName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {assigneeName}
          </span>
        )}
      </div>
    </Link>
  );
}
