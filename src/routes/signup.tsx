import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "@/lib/types";
import logo from "@/assets/worknest-logo.png.asset.json";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Bosses who assign work and review progress." },
  { value: "employee", label: "Employee", desc: "Tech / project workers." },
  { value: "staff", label: "Staff", desc: "Clerks and general workers." },
];

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("employee");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — signing you in…");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo.url} alt="WorkNest logo" className="h-10 w-auto max-w-[48px] object-contain" />
            <span className="text-lg font-semibold">WorkNest</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">I am a…</label>
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <label key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${role === r.value ? "border-accent bg-accent/10" : "hover:bg-muted"}`}>
                  <input type="radio" name="role" className="mt-1" checked={role === r.value} onChange={() => setRole(r.value)} />
                  <div>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={busy}
            className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
