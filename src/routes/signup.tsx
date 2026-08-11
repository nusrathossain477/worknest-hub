import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { roleFromEmail } from "@/lib/types";
import logo from "@/assets/worknest-logo.png.asset.json";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const detected = roleFromEmail(email);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!detected) {
      toast.error("Use the WorkNest work email issued to you by HR");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account activated — signing you in…");
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
          <h1 className="mt-4 text-2xl font-bold">Activate your work account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the work email issued to you by HR.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Work email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={`name@${ROLE_DOMAIN.employee}`}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
            <p className="mt-1 text-xs text-muted-foreground">
              {email
                ? detected
                  ? `Verified — this email signs in as ${detected.toUpperCase()}.`
                  : "Not a WorkNest work email. Ask HR for your account."
                : "Issued by HR."}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={busy || !detected}
            className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {busy ? "Activating…" : "Activate account"}
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
