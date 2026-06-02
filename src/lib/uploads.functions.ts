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
    // Replace any existing upload for this area+date by this supervisor (most recent wins),
    // and clear any "missing" placeholder rows created by a premature Submit.
    const { data: existing } = await context.supabase
      .from("cleaning_uploads").select("id,supervisor_id,status")
      .eq("area_id", data.area_id).eq("service_date", data.service_date);
    const toDelete = (existing ?? []).filter(
      (r: any) => r.supervisor_id === context.userId || r.status === "missing"
    );
    if (toDelete.length > 0) {
      await context.supabase.from("cleaning_uploads").delete()
        .in("id", toDelete.map((r: any) => r.id));
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

export const deleteUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roles) throw new Error("Forbidden: admin only");
    const { error } = await context.supabase.from("cleaning_uploads").delete().eq("id", data.id);
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

// Add `days` to a YYYY-MM-DD string and return the same shape.
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Is a given service_date currently visible to clients for this property?
// Default: visible the day AFTER the service date, at the property's daily_report_time.
// If `instant_client_release` is on, visible as soon as it's uploaded.
function isServiceDateReleased(property: any, serviceDate: string): boolean {
  if (!property) return true;
  if (property.instant_client_release) return true;
  const tz = property.daily_report_timezone || "America/New_York";
  const releaseTime = (property.daily_report_time || "08:00:00").slice(0, 8);
  const { date: todayLocal, time } = nowInTz(tz);
  const releaseDay = addDays(serviceDate, 1);
  if (todayLocal > releaseDay) return true;
  if (todayLocal === releaseDay && time >= releaseTime) return true;
  return false;
}

// Returns true if caller is admin or an assigned supervisor for the property.
async function callerBypassesRelease(supabase: any, userId: string, propertyId: string): Promise<boolean> {
  const { data: roles } = await supabase
    .from("user_roles").select("role").eq("user_id", userId);
  const roleSet = new Set((roles ?? []).map((r: any) => r.role));
  if (roleSet.has("admin")) return true;
  if (roleSet.has("supervisor")) {
    const { data: a } = await supabase
      .from("property_assignments").select("id")
      .eq("user_id", userId).eq("property_id", propertyId).maybeSingle();
    if (a) return true;
  }
  return false;
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
    const bypass = await callerBypassesRelease(context.supabase, context.userId, data.property_id);
    const canSee = (sd: string) => bypass || isServiceDateReleased(property, sd);

    let serviceDate = data.service_date;
    if (!serviceDate) {
      const { data: rows } = await context.supabase
        .from("cleaning_uploads").select("service_date")
        .eq("property_id", data.property_id)
        .order("service_date", { ascending: false }).limit(60);
      const allowed = (rows ?? [])
        .map((r: any) => r.service_date)
        .find((d: string) => canSee(d));
      serviceDate = allowed ?? todayLocal;
    }

    const sd: string = serviceDate ?? todayLocal;
    const showUploads = canSee(sd);
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

// Available service dates for a property
export const listServiceDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ property_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: property }, { data: rows }] = await Promise.all([
      context.supabase.from("properties")
        .select("daily_report_time,daily_report_timezone,instant_client_release")
        .eq("id", data.property_id).maybeSingle(),
      context.supabase.from("cleaning_uploads").select("service_date")
        .eq("property_id", data.property_id)
        .order("service_date", { ascending: false }).limit(180),
    ]);
    const bypass = await callerBypassesRelease(context.supabase, context.userId, data.property_id);
    const set = new Set<string>();
    (rows ?? []).forEach((r: any) => {
      if (bypass || isServiceDateReleased(property, r.service_date)) {
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
