import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { fetchVisibleMembers, type MemberRow } from "@/lib/members";
import { provisionAccount, resetAccountPassword } from "@/lib/people.functions";
import { type AppRole } from "@/lib/types";
import { RoleBadge } from "@/components/RoleBadge";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/people")({
  component: PeoplePage,
  head: () => ({
    meta: [
      { title: "HR — Work Accounts | WorkNest" },
      {
        name: "description",
        content:
          "HR issues WorkNest work emails and roles. Roles are derived from the work email domain and cannot be self-selected.",
      },
      { property: "og:title", content: "HR — Work Accounts | WorkNest" },
      { property: "og:description", content: "Issue verified WorkNest work emails and roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Bosses — assign and review work." },
  { value: "employee", label: "Employee", desc: "Technical / project workers." },
  { value: "staff", label: "Staff", desc: "Clerical and general workers." },
  { value: "hr", label: "HR", desc: "Issues accounts and roles." },
];

function PeoplePage() {
  const { role } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const load = async () => setMembers(await fetchVisibleMembers());
  useEffect(() => {
    load();
  }, []);

  const hrExists = members.some((m) => m.role === "hr");
  const allowed = role === "hr" || (role === "admin" && !hrExists);

  if (role !== "hr" && role !== "admin") return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Work accounts</h1>
        <p className="text-sm text-muted-foreground">
          HR issues every WorkNest work email. The email domain decides the role — nobody can pick their
          own role at login.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border bg-card p-5 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-success-foreground" /> How roles work
        </div>
        {ROLES.map((r) => (
          <div key={r.value} className="text-muted-foreground">
            <span className="capitalize text-foreground">{r.label}:</span> {r.desc}
          </div>
        ))}
      </div>

      {allowed ? (
        <ProvisionCard onCreated={load} hrExists={hrExists} />
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-5 text-sm text-muted-foreground">
          Only HR can issue new work accounts.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Work email</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Designation</th>
              <th className="px-4 py-2 font-medium">Role</th>
              {allowed && <th className="px-4 py-2 font-medium">Password</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2">{m.full_name || "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{m.email || "—"}</td>
                <td className="hidden px-4 py-2 text-muted-foreground md:table-cell">
                  {m.designation || "—"}
                </td>
                <td className="px-4 py-2">
                  <RoleBadge role={m.role} />
                </td>
                {allowed && (
                  <td className="px-4 py-2">
                    <ResetPassword userId={m.id} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProvisionCard({ onCreated, hrExists }: { onCreated: () => void; hrExists: boolean }) {
  const create = useServerFn(provisionAccount);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "employee" as AppRole,
    password: "",
    designation: "",
    department: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await create({ data: form });
      toast.success(`Account created — ${res.email}`);
      setForm({ ...form, fullName: "", email: "", password: "", designation: "", department: "" });
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create the account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        <UserPlus className="h-4 w-4" /> Issue a new work account
      </div>
      {!hrExists && (
        <p className="rounded-md bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
          No HR account exists yet — create one now (role “HR”). After that, only HR can issue accounts.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="runa@gmail.com"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Temporary password">
          <input
            required
            minLength={8}
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Designation">
          <input
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label="Department">
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function ResetPassword({ userId }: { userId: string }) {
  const reset = useServerFn(resetAccountPassword);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (value.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await reset({ data: { userId, password: value } });
      toast.success("Password updated");
      setValue("");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update the password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New password"
        className="w-32 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        onClick={run}
        disabled={busy}
        title="Set password"
        className="rounded-md p-1.5 hover:bg-muted disabled:opacity-50"
      >
        <KeyRound className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
