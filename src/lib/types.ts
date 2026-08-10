export type AppRole = "hr" | "admin" | "employee" | "staff";

export const ROLE_DOMAIN: Record<AppRole, string> = {
  hr: "hr.worknest.bd",
  admin: "admin.worknest.bd",
  employee: "employee.worknest.bd",
  staff: "staff.worknest.bd",
};

export function roleFromEmail(email: string): AppRole | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const found = (Object.keys(ROLE_DOMAIN) as AppRole[]).find((r) => ROLE_DOMAIN[r] === domain);
  return found ?? null;
}
export type TaskStatus = "pending" | "in_progress" | "submitted" | "completed" | "late";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type UpdateType = "progress" | "request";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  designation: string;
  department: string;
  phone: string;
  bio: string;
  avatar_url: string | null;
}

export interface Skill {
  id: string;
  name: string;
  created_at: string;
}

export interface ProfileSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: number;
  created_at: string;
}

export interface ProfileSkillWithName extends ProfileSkill {
  skill: { id: string; name: string } | null;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  phone: string;
  helpline: string;
  support_email: string;
  website: string;
  updated_at: string;
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
  required_skill_id: string | null;
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

export type AttachmentKind = "file" | "link";

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  kind: AttachmentKind;
  file_name: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  link_url: string | null;
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
