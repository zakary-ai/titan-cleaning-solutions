import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

    const [
      { data: properties },
      { data: requiredAreas },
      { data: uploadsToday },
      { count: openIssues },
      { count: commentsThisWeek },
    ] = await Promise.all([
      context.supabase.from("properties").select("id").eq("active", true),
      context.supabase.from("property_areas").select("id,property_id")
        .eq("active", true).eq("required_upload", true),
      context.supabase.from("cleaning_uploads").select("property_id,area_id,status")
        .eq("service_date", today),
      context.supabase.from("issues").select("*", { count: "exact", head: true }).eq("status", "open"),
      // One comment per thread => count issues created this week
      context.supabase.from("issues").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    ]);

    const propIds = (properties ?? []).map((p: any) => p.id);
    const requiredByProp = new Map<string, Set<string>>();
    for (const a of requiredAreas ?? []) {
      if (!requiredByProp.has(a.property_id)) requiredByProp.set(a.property_id, new Set());
      requiredByProp.get(a.property_id)!.add(a.id);
    }
    const uploadedByProp = new Map<string, Set<string>>();
    for (const u of uploadsToday ?? []) {
      if (u.status !== "uploaded") continue;
      if (!uploadedByProp.has(u.property_id)) uploadedByProp.set(u.property_id, new Set());
      uploadedByProp.get(u.property_id)!.add(u.area_id);
    }

    let completed = 0;
    for (const pid of propIds) {
      const required = requiredByProp.get(pid);
      if (!required || required.size === 0) continue;
      const uploaded = uploadedByProp.get(pid) ?? new Set();
      let allDone = true;
      for (const aid of required) if (!uploaded.has(aid)) { allDone = false; break; }
      if (allDone) completed++;
    }
    const missing = Math.max(0, propIds.length - completed);

    return {
      propertiesCompletedToday: completed,
      propertiesMissingToday: missing,
      openIssues: openIssues ?? 0,
      commentsThisWeek: commentsThisWeek ?? 0,
    };
  });

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const { data: properties } = await context.supabase
      .from("properties").select("id,name").eq("active", true);
    const { data: uploads } = await context.supabase
      .from("cleaning_uploads").select("property_id,status").gte("service_date", since);
    const { data: issues } = await context.supabase
      .from("issues").select("property_id").gte("created_at", since + "T00:00:00Z");

    const stats = (properties ?? []).map((p: any) => {
      const propUploads = (uploads ?? []).filter((u: any) => u.property_id === p.id);
      const total = propUploads.length;
      const completed = propUploads.filter((u: any) => u.status === "uploaded").length;
      const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
      const comments = (issues ?? []).filter((i: any) => i.property_id === p.id).length;
      return { id: p.id, name: p.name, completion, comments, total_records: total };
    });

    return stats.sort((a, b) => b.comments - a.comments);
  });
