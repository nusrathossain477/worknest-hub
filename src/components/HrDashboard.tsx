import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { fetchVisibleMembers, type MemberRow } from "@/lib/members";
import { RoleBadge } from "./RoleBadge";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { ShieldCheck, Users, UserCog, ClipboardList } from "lucide-react";

export function HrDashboard() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    fetchVisibleMembers().then(setMembers);
  }, []);

  const counts = useMemo(() => {
    const c: Record<AppRole, number> = { hr: 0, admin: 0, employee: 0, staff: 0 };
    members.forEach((m) => { c[m.role] += 1; });
    return c;
  }, [members]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">HR overview</h1>
          <p className="text-sm text-muted-foreground">
            Hi {profile?.full_name?.split(" ")[0] || "there"} — you issue every WorkNest work account and role.
          </p>
        </div>
        <Link to="/people"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <UserCog className="h-4 w-4" /> Manage work accounts
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ShieldCheck} label="HR" value={counts.hr} />
        <Stat icon={Users} label="Admins" value={counts.admin} />
        <Stat icon={ClipboardList} label="Employees" value={counts.employee} />
        <Stat icon={Users} label="Staff" value={counts.staff} />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-2 font-semibold">How roles work</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Nobody selects a role when signing in. You assign each person's role when you create
          their account:
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
            <li key={r} className="flex items-center gap-2">
              <RoleBadge role={r} />
              <span className="text-muted-foreground">{ROLE_LABELS[r]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Everyone ({members.length})</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Work email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">{m.full_name || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{m.email || "—"}</td>
                  <td className="px-4 py-2"><RoleBadge role={m.role} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}
