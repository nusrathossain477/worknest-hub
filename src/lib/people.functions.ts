import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLE_DOMAINS: Record<string, string> = {
  hr: "hr.worknest.bd",
  admin: "admin.worknest.bd",
  employee: "employee.worknest.bd",
  staff: "staff.worknest.bd",
};

const provisionSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, "Use letters, numbers, dot, dash or underscore"),
  role: z.enum(["hr", "admin", "employee", "staff"]),
  password: z.string().min(8).max(72),
  designation: z.string().trim().max(80).optional().default(""),
  department: z.string().trim().max(80).optional().default(""),
});

/** Only HR may issue work accounts. An admin may create the very first HR account. */
async function assertCanProvision(supabase: any, userId: string) {
  const { data: isHr } = await supabase.rpc("has_role", { _user_id: userId, _role: "hr" });
  if (isHr) return;
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Only HR can create WorkNest accounts");
  const { count } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "hr");
  if ((count ?? 0) > 0) throw new Error("Only HR can create WorkNest accounts");
}

export const provisionAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => provisionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCanProvision(context.supabase, context.userId);

    const email = `${data.username}@${ROLE_DOMAINS[data.role]}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the account");

    if (data.designation || data.department) {
      await supabaseAdmin
        .from("profiles")
        .update({ designation: data.designation ?? "", department: data.department ?? "" })
        .eq("id", created.user.id);
    }

    return { id: created.user.id, email, role: data.role };
  });

export const resetAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCanProvision(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
