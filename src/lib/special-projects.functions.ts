import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listSpecialProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ property_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("special_projects").select("*")
      .eq("property_id", data.property_id)
      .order("project_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listSpecialProjectDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ property_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("special_projects").select("project_date")
      .eq("property_id", data.property_id)
      .order("project_date", { ascending: false }).limit(365);
    if (error) throw new Error(error.message);
    return Array.from(new Set((rows ?? []).map((r: any) => r.project_date)));
  });

export const getSpecialProjectsByDate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    project_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("special_projects").select("*")
      .eq("property_id", data.property_id)
      .eq("project_date", data.project_date)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createSpecialProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    property_id: z.string().uuid(),
    caption: z.string().trim().min(1).max(200),
    file_url: z.string().min(1).max(1024),
    file_type: z.enum(["image", "video"]),
    project_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const insert: any = {
      property_id: data.property_id,
      caption: data.caption,
      file_url: data.file_url,
      file_type: data.file_type,
      supervisor_id: context.userId,
    };
    if (data.project_date) insert.project_date = data.project_date;
    const { data: row, error } = await context.supabase
      .from("special_projects").insert(insert).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSpecialProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("special_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
