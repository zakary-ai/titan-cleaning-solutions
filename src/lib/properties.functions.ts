import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ===== Properties =====
export const listProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("properties").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().trim().min(1).max(120),
    address: z.string().trim().max(255).optional().nullable(),
    client_organization: z.string().trim().max(120).optional().nullable(),
    areas: z.array(z.string().trim().min(1).max(120)).max(50).optional().default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { areas, ...propertyInput } = data;
    const { data: row, error } = await context.supabase
      .from("properties").insert(propertyInput).select("*").single();
    if (error) throw new Error(error.message);

    if (areas && areas.length > 0) {
      const rows = areas.map((area_name, idx) => ({
        property_id: row.id,
        area_name,
        required_upload: true,
        display_order: idx + 1,
        active: true,
      }));
      const { error: areaErr } = await context.supabase.from("property_areas").insert(rows);
      if (areaErr) throw new Error(areaErr.message);
    }
    return row;
  });

export const updateProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120).optional(),
    address: z.string().trim().max(255).nullable().optional(),
    client_organization: z.string().trim().max(120).nullable().optional(),
    active: z.boolean().optional(),
    daily_report_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    daily_report_timezone: z.string().trim().min(1).max(64).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("properties").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProperty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: property }, { data: areas }, { data: assignments }] = await Promise.all([
      context.supabase.from("properties").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("property_areas").select("*").eq("property_id", data.id).order("display_order"),
      context.supabase.from("property_assignments").select("*").eq("property_id", data.id),
    ]);
    return { property, areas: areas ?? [], assignments: assignments ?? [] };
  });

// ===== Areas =====
export const upsertArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    property_id: z.string().uuid(),
    area_name: z.string().trim().min(1).max(120),
    required_upload: z.boolean().default(true),
    display_order: z.number().int().default(0),
    active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await context.supabase.from("property_areas").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("property_areas").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("property_areas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Assignments =====
export const assignUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_on_property: z.enum(["supervisor", "client"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("property_assignments")
      .insert(data);
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const unassignUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("property_assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unassignUserFromProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    property_id: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("property_assignments")
      .delete().eq("user_id", data.user_id).eq("property_id", data.property_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
