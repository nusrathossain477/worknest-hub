import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/worknest-logo.png.asset.json";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo.url} alt="WorkNest logo" className="h-10 w-auto max-w-[48px] object-contain" />
            <span className="text-lg font-semibold">WorkNest</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Account activation</h1>
          <p className="mt-1 text-sm text-muted-foreground">WorkNest accounts are issued by HR.</p>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
          Accounts can't be created here. Ask HR to set up your account with your real email
          address — you'll receive a welcome email with your login email, role, and a link to set
          your password.
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
