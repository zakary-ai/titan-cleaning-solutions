import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const deleteIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error: mErr } = await context.supabase.from("messages").delete().eq("issue_id", data.id);
    if (mErr) throw new Error(mErr.message);
    const { error: rErr } = await context.supabase.from("issue_reads").delete().eq("issue_id", data.id);
    if (rErr) throw new Error(rErr.message);
    const { error } = await context.supabase.from("issues").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Client creates an issue / comment on an upload
export const createIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    area_id: z.string().uuid().optional().nullable(),
    upload_id: z.string().uuid().optional().nullable(),
    special_project_id: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(1).max(160),
    initial_comment: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("issues").insert({
      ...data,
      client_user_id: context.userId,
      status: "open",
    }).select("*").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("messages").insert({
      issue_id: row.id, sender_id: context.userId, body: data.initial_comment,
    });
    return row;
  });

// List issues visible to current user (RLS filters)
export const listIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    status: z.enum(["open", "in_progress", "resolved", "all"]).default("all"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("issues").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: issues, error } = await q;
    if (error) throw new Error(error.message);
    if (!issues || issues.length === 0) return { issues: [], properties: {}, areas: {}, profiles: {}, specialProjects: {} };
    const propIds = Array.from(new Set(issues.map((i: any) => i.property_id)));
    const areaIds = Array.from(new Set(issues.map((i: any) => i.area_id).filter(Boolean)));
    const userIds = Array.from(new Set(issues.map((i: any) => i.client_user_id).filter(Boolean)));
    const spIds = Array.from(new Set(issues.map((i: any) => i.special_project_id).filter(Boolean)));
    const [{ data: properties }, { data: areas }, { data: profiles }, { data: specials }] = await Promise.all([
      context.supabase.from("properties").select("id,name,client_organization").in("id", propIds),
      areaIds.length ? context.supabase.from("property_areas").select("id,area_name").in("id", areaIds) : Promise.resolve({ data: [] }),
      userIds.length ? context.supabase.from("profiles").select("id,full_name,email,organization_name").in("id", userIds) : Promise.resolve({ data: [] }),
      spIds.length ? context.supabase.from("special_projects").select("id,caption,file_url,file_type").in("id", spIds) : Promise.resolve({ data: [] }),
    ]);
    const toMap = (rows: any[], k = "id") => Object.fromEntries((rows ?? []).map((r) => [r[k], r]));
    return { issues, properties: toMap(properties as any[]), areas: toMap(areas as any[]), profiles: toMap(profiles as any[]), specialProjects: toMap(specials as any[]) };
  });

export const getIssueThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: issue } = await context.supabase.from("issues").select("*").eq("id", data.id).maybeSingle();
    if (!issue) throw new Error("Issue not found");
    const { data: messages } = await context.supabase
      .from("messages").select("*").eq("issue_id", data.id).order("created_at");
    const senderIds = Array.from(new Set((messages ?? []).map((m: any) => m.sender_id).filter(Boolean)));
    const { data: profiles } = senderIds.length
      ? await context.supabase.from("profiles").select("id,full_name,email").in("id", senderIds)
      : { data: [] };
    const { data: property } = await context.supabase
      .from("properties").select("name").eq("id", issue.property_id).maybeSingle();
    const { data: area } = issue.area_id
      ? await context.supabase.from("property_areas").select("area_name").eq("id", issue.area_id).maybeSingle()
      : { data: null };
    const { data: upload } = issue.upload_id
      ? await context.supabase.from("cleaning_uploads").select("*").eq("id", issue.upload_id).maybeSingle()
      : { data: null };
    const { data: special_project } = issue.special_project_id
      ? await context.supabase.from("special_projects").select("id,caption,file_url,file_type").eq("id", issue.special_project_id).maybeSingle()
      : { data: null };
    return {
      issue, messages: messages ?? [],
      profiles: Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p])),
      property, area, upload, special_project,
    };
  });

export const replyToIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    issue_id: z.string().uuid(),
    body: z.string().trim().max(2000).default(""),
    attachment_url: z.string().trim().max(1024).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (!data.body && !data.attachment_url) throw new Error("Empty message");
    const { error } = await context.supabase.from("messages").insert({
      issue_id: data.issue_id,
      sender_id: context.userId,
      body: data.body || "",
      attachment_url: data.attachment_url ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setIssueStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "in_progress", "resolved"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: any = { status: data.status };
    if (data.status === "resolved") patch.resolved_at = new Date().toISOString();
    if (data.status !== "resolved") patch.resolved_at = null;
    const { error } = await context.supabase.from("issues").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Mark a thread read (called when user opens it)
export const markIssueRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ issue_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("issue_reads").upsert(
      { user_id: context.userId, issue_id: data.issue_id, last_read_at: new Date().toISOString() },
      { onConflict: "user_id,issue_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Total unread messages across all OPEN issues visible to current user
export const getUnreadIssueCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only count unread from non-resolved issues
    const { data: issues } = await context.supabase
      .from("issues").select("id").neq("status", "resolved").limit(500);
    const ids = (issues ?? []).map((i: any) => i.id);
    if (ids.length === 0) return { count: 0 };

    const [{ data: messages }, { data: reads }] = await Promise.all([
      context.supabase.from("messages")
        .select("issue_id,sender_id,created_at")
        .in("issue_id", ids).limit(2000),
      context.supabase.from("issue_reads")
        .select("issue_id,last_read_at")
        .eq("user_id", context.userId).in("issue_id", ids),
    ]);
    const lastRead = new Map<string, number>();
    for (const r of reads ?? []) lastRead.set(r.issue_id, new Date(r.last_read_at).getTime());

    let count = 0;
    for (const m of messages ?? []) {
      if (m.sender_id === context.userId) continue;
      const lr = lastRead.get(m.issue_id) ?? 0;
      if (new Date(m.created_at).getTime() > lr) count++;
    }
    return { count };
  });

// Mark every visible issue as read (used by "Mark all as read")
export const markAllIssuesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: issues } = await context.supabase
      .from("issues").select("id").limit(500);
    const ids = (issues ?? []).map((i: any) => i.id);
    if (ids.length === 0) return { ok: true, count: 0 };
    const now = new Date().toISOString();
    const rows = ids.map((issue_id) => ({ user_id: context.userId, issue_id, last_read_at: now }));
    const { error } = await context.supabase.from("issue_reads")
      .upsert(rows, { onConflict: "user_id,issue_id" });
    if (error) throw new Error(error.message);
    return { ok: true, count: ids.length };
  });
