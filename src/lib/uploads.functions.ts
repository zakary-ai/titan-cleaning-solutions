import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Supervisor: list assigned properties
export const listMyProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: assignments } = await context.supabase
      .from("property_assignments").select("property_id").eq("user_id", context.userId);
    const ids = (assignments ?? []).map((a: any) => a.property_id);
    if (ids.length === 0) return [];
    const { data: props } = await context.supabase
      .from("properties").select("*").in("id", ids).eq("active", true).order("name");
    return props ?? [];
  });

// Supervisor: nightly checklist for a property + date
export const getNightlyChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: property }, { data: areas }, { data: uploads }] = await Promise.all([
      context.supabase.from("properties").select("*").eq("id", data.property_id).maybeSingle(),
      context.supabase.from("property_areas").select("*")
        .eq("property_id", data.property_id).eq("active", true).order("display_order"),
      context.supabase.from("cleaning_uploads").select("*")
        .eq("property_id", data.property_id).eq("service_date", data.service_date),
    ]);
    return { property, areas: areas ?? [], uploads: uploads ?? [] };
  });

// Create cleaning_upload row (file already uploaded to storage)
export const recordUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    area_id: z.string().uuid(),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    file_url: z.string().min(1).max(1024),
    file_type: z.enum(["image", "video"]),
    notes: z.string().trim().max(2000).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Replace any existing upload for this area+date by this supervisor (most recent wins)
    const { data: existing } = await context.supabase
      .from("cleaning_uploads").select("id").eq("area_id", data.area_id)
      .eq("service_date", data.service_date).eq("supervisor_id", context.userId);
    if (existing && existing.length > 0) {
      await context.supabase.from("cleaning_uploads").delete()
        .in("id", existing.map((r: any) => r.id));
    }
    const { data: row, error } = await context.supabase.from("cleaning_uploads").insert({
      ...data,
      supervisor_id: context.userId,
      status: "uploaded",
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

// Update notes on an existing upload
export const updateUploadNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    notes: z.string().trim().max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cleaning_uploads").update({ notes: data.notes }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Submit nightly report — mark missing required areas
export const submitNightlyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: areas } = await context.supabase
      .from("property_areas").select("id,required_upload")
      .eq("property_id", data.property_id).eq("active", true);
    const { data: uploads } = await context.supabase
      .from("cleaning_uploads").select("area_id")
      .eq("property_id", data.property_id).eq("service_date", data.service_date);
    const uploadedSet = new Set((uploads ?? []).map((u: any) => u.area_id));
    const missingRequired = (areas ?? []).filter((a: any) => a.required_upload && !uploadedSet.has(a.id));
    if (missingRequired.length > 0) {
      const rows = missingRequired.map((a: any) => ({
        property_id: data.property_id,
        area_id: a.id,
        supervisor_id: context.userId,
        service_date: data.service_date,
        status: "missing" as const,
      }));
      const { error } = await context.supabase.from("cleaning_uploads").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true, marked_missing: missingRequired.length };
  });

// Client / shared: get latest report for a property by date (defaults to most recent)
export const getPropertyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let serviceDate = data.service_date;
    if (!serviceDate) {
      const { data: latest } = await context.supabase
        .from("cleaning_uploads").select("service_date")
        .eq("property_id", data.property_id)
        .order("service_date", { ascending: false }).limit(1).maybeSingle();
      serviceDate = latest?.service_date ?? new Date().toISOString().slice(0, 10);
    }
    const [{ data: property }, { data: areas }, { data: uploads }] = await Promise.all([
      context.supabase.from("properties").select("*").eq("id", data.property_id).maybeSingle(),
      context.supabase.from("property_areas").select("*")
        .eq("property_id", data.property_id).eq("active", true).order("display_order"),
      context.supabase.from("cleaning_uploads").select("*")
        .eq("property_id", data.property_id).eq("service_date", serviceDate)
        .order("uploaded_at", { ascending: false }),
    ]);
    return { property, areas: areas ?? [], uploads: uploads ?? [], service_date: serviceDate };
  });

// Available service dates for a property
export const listServiceDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ property_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("cleaning_uploads").select("service_date")
      .eq("property_id", data.property_id)
      .order("service_date", { ascending: false }).limit(180);
    const set = new Set<string>();
    (rows ?? []).forEach((r: any) => set.add(r.service_date));
    return Array.from(set);
  });

// Area history
export const getAreaHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ area_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: uploads } = await context.supabase
      .from("cleaning_uploads").select("*").eq("area_id", data.area_id)
      .order("service_date", { ascending: false }).limit(60);
    return uploads ?? [];
  });

// Sign URL for viewing media
export const signMediaUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string().min(1).max(1024) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase
      .storage.from("cleaning-media").createSignedUrl(data.path, 3600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
