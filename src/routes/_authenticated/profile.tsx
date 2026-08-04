import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SkillsEditor } from "@/components/SkillsEditor";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "My Profile — WorkNest" },
      { name: "description", content: "Update your WorkNest profile details, department and skills." },
      { property: "og:title", content: "My Profile — WorkNest" },
      { property: "og:description", content: "Update your WorkNest profile details, department and skills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfilePage() {
  const { user, profile, role, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    designation: "",
    department: "",
    phone: "",
    bio: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        designation: profile.designation ?? "",
        department: profile.department ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    refresh();
  };

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={key}>{label}</label>
      <input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep this up to date — admins use it to assign the right work to the right person.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("full_name", "Full name", "Your name")}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input value={profile?.email ?? ""} disabled className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground" />
          </div>
          {field("designation", "Designation", "e.g. Senior Engineer")}
          {field("department", "Department", "e.g. Engineering")}
          {field("phone", "Phone", "+880 1XXX-XXXXXX")}
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            <input value={role ?? ""} disabled className="w-full rounded-md border bg-muted px-3 py-2 text-sm capitalize text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="bio">About</label>
          <textarea
            id="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="A short summary of what you do"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-5">
        <div>
          <h2 className="font-semibold">My skills</h2>
          <p className="text-sm text-muted-foreground">Rate yourself 1–5 stars so work is matched to your strengths.</p>
        </div>
        {user && <SkillsEditor userId={user.id} editable />}
      </div>
    </div>
  );
}
