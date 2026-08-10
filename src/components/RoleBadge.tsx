import type { AppRole } from "@/lib/types";

const map: Record<AppRole, string> = {
  hr: "bg-success/15 text-success-foreground",
  admin: "bg-primary/10 text-primary",
  employee: "bg-accent/15 text-accent-foreground",
  staff: "bg-muted text-foreground",
};

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${map[role]}`}>
      {role}
    </span>
  );
}
