import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/types";

export interface MemberRow extends Profile {
  role: AppRole;
}

/**
 * Returns only the people the signed-in user is allowed to see.
 * Visibility rules are enforced in the database (visible_members):
 *  - everyone sees themselves and HR
 *  - admins see everyone
 *  - employees additionally see staff
 *  - staff see only themselves and HR
 */
export async function fetchVisibleMembers(): Promise<MemberRow[]> {
  const { data, error } = await supabase.rpc("visible_members");
  if (error || !data) return [];
  return (data as MemberRow[]).slice().sort((a, b) =>
    (a.full_name || a.email).localeCompare(b.full_name || b.email),
  );
}
