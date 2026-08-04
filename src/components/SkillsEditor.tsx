import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileSkillWithName, Skill } from "@/lib/types";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

export function SkillsEditor({ userId, editable }: { userId: string; editable: boolean }) {
  const [rows, setRows] = useState<ProfileSkillWithName[]>([]);
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: mine }, { data: all }] = await Promise.all([
      supabase
        .from("profile_skills")
        .select("id, user_id, skill_id, proficiency, created_at, skill:skills(id, name)")
        .eq("user_id", userId),
      supabase.from("skills").select("*").order("name"),
    ]);
    setRows(((mine as unknown) as ProfileSkillWithName[]) ?? []);
    setCatalog(((all as unknown) as Skill[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const add = async () => {
    const clean = name.trim();
    if (!clean) return;
    if (clean.length > 40) { toast.error("Skill name is too long (max 40 characters)"); return; }
    setBusy(true);

    let skillId = catalog.find((s) => s.name.toLowerCase() === clean.toLowerCase())?.id;
    if (!skillId) {
      const { data, error } = await supabase.from("skills").insert({ name: clean }).select("id").single();
      if (error || !data) {
        const { data: existing } = await supabase.from("skills").select("id").ilike("name", clean).maybeSingle();
        if (!existing) { toast.error(error?.message ?? "Could not add skill"); setBusy(false); return; }
        skillId = existing.id;
      } else {
        skillId = data.id;
      }
    }

    const { error: linkErr } = await supabase
      .from("profile_skills")
      .upsert({ user_id: userId, skill_id: skillId, proficiency: level }, { onConflict: "user_id,skill_id" });
    if (linkErr) { toast.error(linkErr.message); setBusy(false); return; }

    setName("");
    setLevel(3);
    setBusy(false);
    toast.success("Skill saved");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("profile_skills").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const setProficiency = async (id: string, value: number) => {
    const { error } = await supabase.from("profile_skills").update({ proficiency: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
        {rows.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs">
            <span className="font-medium">{r.skill?.name ?? "Skill"}</span>
            {editable ? (
              <select
                value={r.proficiency}
                onChange={(e) => setProficiency(r.id, Number(e.target.value))}
                aria-label="Proficiency"
                className="rounded border bg-background px-1 py-0.5 text-[11px] outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)}</option>
                ))}
              </select>
            ) : (
              <span className="text-accent">{"★".repeat(r.proficiency)}</span>
            )}
            {editable && (
              <button onClick={() => remove(r.id)} title="Remove skill" className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            list="skills-catalog"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a skill (e.g. React, Excel)"
            className="w-56 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <datalist id="skills-catalog">
            {catalog.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            aria-label="Skill level"
            className="rounded-md border bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
