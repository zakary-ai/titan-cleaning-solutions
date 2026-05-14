import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// List all users with role + profile (admin)
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: profiles, error } = await context.supabase
      .from("profiles").select("id,full_name,email,organization_name,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id,role");
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    return (profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? null }));
  });

// Search users (for assignments)
export const searchUsersByRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ role: z.enum(["supervisor", "client"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: roleRows } = await context.supabase
      .from("user_roles").select("user_id").eq("role", data.role);
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await context.supabase
      .from("profiles").select("id,full_name,email,organization_name").in("id", ids);
    return profiles ?? [];
  });
