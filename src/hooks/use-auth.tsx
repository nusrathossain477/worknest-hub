import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserMeta = async (uid: string) => {
    const [{ data: prof }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);
    setRole(((roleRow?.role as AppRole) ?? null));
  };

  // Check-in if no open attendance row today
  const ensureCheckIn = async (uid: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("attendance")
      .select("id, check_out")
      .eq("user_id", uid)
      .eq("work_date", today)
      .order("check_in", { ascending: false })
      .limit(1);
    const open = data?.find((r) => !r.check_out);
    if (!open) {
      await supabase.from("attendance").insert({ user_id: uid, work_date: today });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer to next tick — never call supabase inside the callback synchronously
        setTimeout(() => {
          loadUserMeta(sess.user.id);
          ensureCheckIn(sess.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadUserMeta(sess.user.id).then(() => ensureCheckIn(sess.user.id));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (user) {
      // auto check-out
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("attendance")
        .select("id")
        .eq("user_id", user.id)
        .eq("work_date", today)
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1);
      if (data?.[0]) {
        await supabase
          .from("attendance")
          .update({ check_out: new Date().toISOString() })
          .eq("id", data[0].id);
      }
    }
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (user) await loadUserMeta(user.id);
  };

  return (
    <Ctx.Provider value={{ user, session, profile, role, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
