import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { inviteUserAdmin, inviteClientForProperty } from "./admin-invite.server";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    email: z.string().email().toLowerCase().max(255),
    full_name: z.string().trim().min(1).max(120),
    role: z.enum(["admin", "supervisor", "client"]),
    organization_name: z.string().trim().max(120).optional().nullable(),
    password: z.string().min(8).max(72),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    return inviteUserAdmin(data);
  });

export const inviteClientToProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    email: z.string().email().toLowerCase().max(255),
    full_name: z.string().trim().min(1).max(120),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    return inviteClientForProperty(data);
  });
