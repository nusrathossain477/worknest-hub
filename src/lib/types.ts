export type AppRole = "admin" | "employee" | "staff";
export type TaskStatus = "pending" | "in_progress" | "submitted" | "completed" | "late";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type UpdateType = "progress" | "request";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  target_role: AppRole;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  update_type: UpdateType;
  created_at: string;
}

export interface TaskFeedback {
  id: string;
  task_id: string;
  admin_id: string;
  comment: string;
  rating: number | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  related_task_id: string | null;
  read: boolean;
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  work_date: string;
  created_at: string;
}
