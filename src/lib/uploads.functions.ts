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

// Compute current local date + time in a given IANA timezone
function nowInTz(tz: string): { date: string; time: string } {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).formatToParts(new Date()).map((p) => [p.type, p.value])
    ) as Record<string, string>;
    const hour = parts.hour === "24" ? "00" : parts.hour;
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${hour}:${parts.minute}:${parts.second}` };
  } catch {
    const d = new Date();
    return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 19) };
  }
}

// Has today's report been "released" yet for this property?
function isReleased(property: any): boolean {
  if (!property) return true;
  const tz = property.daily_report_timezone || "America/New_York";
  const releaseTime = (property.daily_report_time || "08:00:00").slice(0, 8);
  const { time } = nowInTz(tz);
  return time >= releaseTime;
}

// Client / shared: get latest report for a property by date (defaults to most recent released)
export const getPropertyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: property } = await context.supabase
      .from("properties").select("*").eq("id", data.property_id).maybeSingle();

    const tz = property?.daily_report_timezone || "America/New_York";
    const { date: todayLocal } = nowInTz(tz);
    const released = isReleased(property);

    let serviceDate = data.service_date;
    if (!serviceDate) {
      // Pick most recent service_date the client is allowed to see
      const { data: rows } = await context.supabase
        .from("cleaning_uploads").select("service_date")
        .eq("property_id", data.property_id)
        .order("service_date", { ascending: false }).limit(30);
      const allowed = (rows ?? [])
        .map((r: any) => r.service_date)
        .find((d: string) => d < todayLocal || (d === todayLocal && released));
      serviceDate = allowed ?? todayLocal;
    }

    const sd: string = serviceDate ?? todayLocal;
    const showUploads = sd < todayLocal || (sd === todayLocal && released);
    const [{ data: areas }, { data: uploads }] = await Promise.all([
      context.supabase.from("property_areas").select("*")
        .eq("property_id", data.property_id).eq("active", true).order("display_order"),
      showUploads
        ? context.supabase.from("cleaning_uploads").select("*")
            .eq("property_id", data.property_id).eq("service_date", sd)
            .order("uploaded_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    return { property, areas: areas ?? [], uploads: uploads ?? [], service_date: sd, pending_release: !showUploads };
  });

// Available service dates for a property (hides today until release time)
export const listServiceDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ property_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: property }, { data: rows }] = await Promise.all([
      context.supabase.from("properties")
        .select("daily_report_time,daily_report_timezone").eq("id", data.property_id).maybeSingle(),
      context.supabase.from("cleaning_uploads").select("service_date")
        .eq("property_id", data.property_id)
        .order("service_date", { ascending: false }).limit(180),
    ]);
    const tz = property?.daily_report_timezone || "America/New_York";
    const { date: todayLocal } = nowInTz(tz);
    const released = isReleased(property);
    const set = new Set<string>();
    (rows ?? []).forEach((r: any) => {
      if (r.service_date < todayLocal || (r.service_date === todayLocal && released)) {
        set.add(r.service_date);
      }
    });
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
