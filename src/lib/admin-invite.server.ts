import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function inviteUserAdmin(input: {
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "client";
  organization_name?: string | null;
  redirect_to?: string | null;
}) {
  let userId: string | null = null;
  const { data: invited, error: inviteErr } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
      data: {
        full_name: input.full_name,
        organization_name: input.organization_name ?? null,
        invited_role: input.role,
      },
      ...(input.redirect_to ? { redirectTo: input.redirect_to } : {}),
    });

  if (invited?.user) {
    userId = invited.user.id;
  } else if (inviteErr) {
    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("email", input.email).maybeSingle();
    if (!existing) throw new Error(inviteErr.message);
    userId = existing.id;
  }
  if (!userId) throw new Error("Failed to invite user");

  await supabaseAdmin.from("profiles").update({
    full_name: input.full_name,
    ...(input.organization_name ? { organization_name: input.organization_name } : {}),
  }).eq("id", userId);

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles").select("id").eq("user_id", userId).eq("role", input.role).maybeSingle();
  if (!existingRole) {
    const { error: roleError } = await supabaseAdmin.from("user_roles")
      .insert({ user_id: userId, role: input.role });
    if (roleError) throw new Error(roleError.message);
  }

  return { user_id: userId, email: input.email };
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
export async function inviteUserForProperty(input: {
  property_id: string;
  email: string;
  full_name: string;
  role: "client" | "supervisor";
  redirect_to?: string | null;
}) {
  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("id, name, client_organization")
    .eq("id", input.property_id)
    .maybeSingle();
  if (!property) throw new Error("Property not found");

  let userId: string | null = null;
  const { data: invited, error: inviteErr } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
      data: {
        full_name: input.full_name,
        organization_name: input.role === "client" ? property.client_organization : null,
        invited_for_property: property.name,
        invited_role: input.role,
      },
    });

  if (invited?.user) {
    userId = invited.user.id;
  } else if (inviteErr) {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .maybeSingle();
    if (!existing) throw new Error(inviteErr.message);
    userId = existing.id;
  }
  if (!userId) throw new Error("Failed to invite user");

  await supabaseAdmin.from("profiles").update({
    full_name: input.full_name,
    ...(input.role === "client" ? { organization_name: property.client_organization } : {}),
  }).eq("id", userId);

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id").eq("user_id", userId).eq("role", input.role).maybeSingle();
  if (!existingRole) {
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: input.role });
  }

  const { data: existingAssignment } = await supabaseAdmin
    .from("property_assignments")
    .select("id").eq("user_id", userId).eq("property_id", property.id).maybeSingle();
  if (!existingAssignment) {
    const { error: assignErr } = await supabaseAdmin
      .from("property_assignments")
      .insert({ user_id: userId, property_id: property.id, role_on_property: input.role });
    if (assignErr) throw new Error(assignErr.message);
  }

  return { user_id: userId, email: input.email };
}

export async function listUsersByRoleAdmin(role: "client" | "supervisor", propertyId: string) {
  const { data: roleRows, error } = await supabaseAdmin
    .from("user_roles").select("user_id").eq("role", role);
  if (error) throw new Error(error.message);
  const ids = (roleRows ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];

  const [{ data: profiles }, { data: assigned }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email, organization_name").in("id", ids),
    supabaseAdmin.from("property_assignments").select("user_id").eq("property_id", propertyId).in("user_id", ids),
  ]);
  const assignedSet = new Set((assigned ?? []).map((a) => a.user_id));
  return (profiles ?? []).map((p) => ({ ...p, assigned: assignedSet.has(p.id) }));
}

