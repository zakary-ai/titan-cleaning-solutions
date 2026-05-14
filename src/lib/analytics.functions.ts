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
      { count: totalProperties },
      { count: uploadsToday },
      { count: missingToday },
      { count: openIssues },
      { count: commentsThisWeek },
    ] = await Promise.all([
      context.supabase.from("properties").select("*", { count: "exact", head: true }).eq("active", true),
      context.supabase.from("cleaning_uploads").select("*", { count: "exact", head: true })
        .eq("service_date", today).eq("status", "uploaded"),
      context.supabase.from("cleaning_uploads").select("*", { count: "exact", head: true })
        .eq("service_date", today).eq("status", "missing"),
      context.supabase.from("issues").select("*", { count: "exact", head: true }).eq("status", "open"),
      context.supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    ]);

    return {
      totalProperties: totalProperties ?? 0,
      uploadsToday: uploadsToday ?? 0,
      missingToday: missingToday ?? 0,
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
