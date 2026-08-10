import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCompanySettings } from "@/hooks/use-company";
import { SkillsEditor } from "@/components/SkillsEditor";
import { RoleBadge } from "@/components/RoleBadge";
import { fetchVisibleMembers, type MemberRow } from "@/lib/members";
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

function TeamPage() {
  const { role } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => setMembers(await fetchVisibleMembers());
  useEffect(() => { load(); }, []);

  if (role !== "admin" && role !== "hr") return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Profiles, skills and roles. Roles come from each person&apos;s WorkNest work email and can only be
          changed by HR issuing a new account.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Designation</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Department</th>
              <th className="hidden px-4 py-2 font-medium lg:table-cell">Work email</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <Fragment key={m.id}>
                <tr className="border-t">
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
                  <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">{m.email || "—"}</td>
                  <td className="px-4 py-2"><RoleBadge role={m.role} /></td>
                </tr>
                {open === m.id && (
                  <tr className="border-t bg-muted/20">
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {role === "admin" && <CompanySettingsCard />}
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
