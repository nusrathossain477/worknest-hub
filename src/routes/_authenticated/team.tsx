import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCompanySettings } from "@/hooks/use-company";
import { SkillsEditor } from "@/components/SkillsEditor";
import type { AppRole, Profile } from "@/lib/types";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Team Directory — WorkNest" },
      { name: "description", content: "Browse colleague profiles, skills and roles, and manage company contact details." },
      { property: "og:title", content: "Team Directory — WorkNest" },
      { property: "og:description", content: "Browse colleague profiles, skills and roles in WorkNest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface MemberRow extends Profile { role: AppRole; role_id?: string }

function TeamPage() {
  const { role } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);

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
        <p className="text-sm text-muted-foreground">Profiles, skills and roles for everyone in your company.</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Designation</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Department</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <>
                <tr key={m.id} className="border-t">
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setOpen(open === m.id ? null : m.id)}
                      title="Show details"
                      className="rounded p-1 hover:bg-muted"
                    >
                      {open === m.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-2">{m.full_name || "—"}</td>
                  <td className="hidden px-4 py-2 text-muted-foreground md:table-cell">{m.designation || "—"}</td>
                  <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">{m.department || "—"}</td>
                  <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">{m.email}</td>
                  <td className="px-4 py-2">
                    <select value={m.role} onChange={(e) => changeRole(m, e.target.value as AppRole)}
                      className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring">
                      <option value="admin">Admin</option>
                      <option value="employee">Employee</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                </tr>
                {open === m.id && (
                  <tr key={`${m.id}-details`} className="border-t bg-muted/20">
                    <td colSpan={6} className="space-y-3 px-6 py-4">
                      <div className="grid gap-2 text-sm sm:grid-cols-3">
                        <div><span className="text-muted-foreground">Phone: </span>{m.phone || "—"}</div>
                        <div><span className="text-muted-foreground">Joined: </span>{new Date(m.created_at).toLocaleDateString()}</div>
                        <div className="sm:col-span-3"><span className="text-muted-foreground">About: </span>{m.bio || "—"}</div>
                      </div>
                      <div>
                        <div className="mb-2 text-sm font-medium">Skills</div>
                        <SkillsEditor userId={m.id} editable />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <CompanySettingsCard />
    </div>
  );
}

function CompanySettingsCard() {
  const { settings, reload } = useCompanySettings();
  const [form, setForm] = useState({
    company_name: "", address: "", phone: "", helpline: "", support_email: "", website: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name ?? "",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        helpline: settings.helpline ?? "",
        support_email: settings.support_email ?? "",
        website: settings.website ?? "",
      });
    }
  }, [settings]);

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    const { error } = await supabase.from("company_settings").update(form).eq("id", settings.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Company details updated");
    reload();
  };

  const field = (key: keyof typeof form, label: string) => (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={`cs-${key}`}>{label}</label>
      <input
        id={`cs-${key}`}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <div>
        <h2 className="font-semibold">Company contact details</h2>
        <p className="text-sm text-muted-foreground">Shown to everyone in the sidebar Help &amp; Contact block.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("company_name", "Company name")}
        {field("address", "Office address")}
        {field("phone", "Office phone")}
        {field("helpline", "Helpline")}
        {field("support_email", "Support email")}
        {field("website", "Website")}
      </div>
      <button
        onClick={save}
        disabled={busy || !settings}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save details"}
      </button>
    </div>
  );
}
