import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function inviteUserAdmin(input: {
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "client";
  organization_name?: string | null;
  password: string;
}) {
  // Create user with email confirmed (admin invite flow)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      organization_name: input.organization_name ?? null,
    },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Failed to create user");

  // Profile is created via trigger; ensure org_name is up to date
  if (input.organization_name) {
    await supabaseAdmin.from("profiles").update({
      organization_name: input.organization_name,
      full_name: input.full_name,
    }).eq("id", data.user.id);
  }

  // Assign role
  const { error: roleError } = await supabaseAdmin.from("user_roles")
    .insert({ user_id: data.user.id, role: input.role });
  if (roleError) throw new Error(roleError.message);

  return { user_id: data.user.id, email: data.user.email };
}
