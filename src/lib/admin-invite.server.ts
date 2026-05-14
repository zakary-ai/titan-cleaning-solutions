import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function inviteUserAdmin(input: {
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "client";
  organization_name?: string | null;
  password: string;
}) {
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

  if (input.organization_name) {
    await supabaseAdmin.from("profiles").update({
      organization_name: input.organization_name,
      full_name: input.full_name,
    }).eq("id", data.user.id);
  }

  const { error: roleError } = await supabaseAdmin.from("user_roles")
    .insert({ user_id: data.user.id, role: input.role });
  if (roleError) throw new Error(roleError.message);

  return { user_id: data.user.id, email: data.user.email };
}

/**
 * Invite a client user for a given property.
 * - Uses Supabase Auth invite (sends invitation email via the configured auth email sender).
 * - If the user already exists, we re-use them.
 * - Assigns the `client` role and creates a property_assignment row.
 *
 * This is the basic foundation: the actual email body is the default Supabase
 * "Invite user" template, which we can customize later.
 */
export async function inviteClientForProperty(input: {
  property_id: string;
  email: string;
  full_name: string;
}) {
  // 1. Look up property to get the client_organization (optional).
  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("id, name, client_organization")
    .eq("id", input.property_id)
    .maybeSingle();
  if (!property) throw new Error("Property not found");

  // 2. Try to invite by email. If the user already exists, fall back to looking them up.
  let userId: string | null = null;
  const { data: invited, error: inviteErr } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
      data: {
        full_name: input.full_name,
        organization_name: property.client_organization,
        invited_for_property: property.name,
      },
    });

  if (invited?.user) {
    userId = invited.user.id;
  } else if (inviteErr) {
    // User likely already registered — find them.
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .maybeSingle();
    if (!existing) throw new Error(inviteErr.message);
    userId = existing.id;
  }

  if (!userId) throw new Error("Failed to invite user");

  // 3. Ensure profile reflects name + org.
  await supabaseAdmin.from("profiles").update({
    full_name: input.full_name,
    organization_name: property.client_organization,
  }).eq("id", userId);

  // 4. Ensure client role.
  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "client")
    .maybeSingle();
  if (!existingRole) {
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "client" });
  }

  // 5. Ensure property assignment.
  const { data: existingAssignment } = await supabaseAdmin
    .from("property_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (!existingAssignment) {
    const { error: assignErr } = await supabaseAdmin
      .from("property_assignments")
      .insert({ user_id: userId, property_id: property.id, role_on_property: "client" });
    if (assignErr) throw new Error(assignErr.message);
  }

  return { user_id: userId, email: input.email };
}
