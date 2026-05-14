import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole, Profile } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

interface MemberRow extends Profile { role: AppRole; role_id?: string }

function TeamPage() {
  const { role } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);

  const load = async () => {
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    const map = new Map((roles ?? []).map((r: any) => [r.user_id, r]));
    setMembers(((profs as Profile[]) ?? []).map((p) => {
      const r = map.get(p.id) as any;
      return { ...p, role: (r?.role as AppRole) ?? "staff", role_id: r?.id };
    }));
  };

  useEffect(() => { load(); }, []);

  if (role !== "admin") return <Navigate to="/dashboard" />;

  const changeRole = async (m: MemberRow, newRole: AppRole) => {
    if (m.role_id) {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", m.role_id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: m.id, role: newRole });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Role updated");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-muted-foreground">Manage roles for everyone in your company.</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2">{m.full_name || "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{m.email}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <select value={m.role} onChange={(e) => changeRole(m, e.target.value as AppRole)}
                    className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
