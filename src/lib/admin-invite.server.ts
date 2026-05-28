import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as welcomeTemplate } from "@/lib/email-templates/welcome-app-download";

const TEMP_PASSWORD = "Titan!2026";
const SITE_NAME = "Titan Solutions";
const SENDER_DOMAIN = "notify.titansolutionsco.com";
const FROM_DOMAIN = "titansolutionsco.com";

type AppRole = "admin" | "supervisor" | "client";

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getOrCreateUnsubscribeToken(email: string) {
  const normalizedEmail = email.toLowerCase();

  const { data: suppressed, error: suppressionError } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressionError) throw new Error(suppressionError.message);
  if (suppressed) return null;

  const { data: existingToken, error: tokenLookupError } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (tokenLookupError) throw new Error(tokenLookupError.message);
  if (existingToken?.token && !existingToken.used_at) return existingToken.token;
  if (existingToken?.used_at) return null;

  const token = generateToken();
  const { error: tokenError } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalizedEmail }, { onConflict: "email", ignoreDuplicates: true });
  if (tokenError) throw new Error(tokenError.message);

  const { data: storedToken, error: readBackError } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (readBackError || !storedToken?.token) {
    throw new Error(readBackError?.message ?? "Failed to create unsubscribe token");
  }

  return storedToken.token;
}

async function sendWelcomeEmail(input: { email: string; full_name: string; role: AppRole }) {
  const messageId = crypto.randomUUID();
  try {
    const unsubscribeToken = await getOrCreateUnsubscribeToken(input.email);
    if (!unsubscribeToken) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "welcome-app-download",
        recipient_email: input.email,
        status: "suppressed",
      });
      return;
    }

    const props = { fullName: input.full_name, email: input.email, role: input.role };
    const element = React.createElement(welcomeTemplate.component, props);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof welcomeTemplate.subject === "function"
        ? welcomeTemplate.subject(props)
        : welcomeTemplate.subject;

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "welcome-app-download",
      recipient_email: input.email,
      status: "pending",
    });

    const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: input.email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "welcome-app-download",
        idempotency_key: `welcome-${input.email}-${messageId}`,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue welcome email", enqueueError);
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "welcome-app-download",
        recipient_email: input.email,
        status: "failed",
        error_message: enqueueError.message,
      });
    }
  } catch (err) {
    console.error("sendWelcomeEmail failed", err);
    throw err instanceof Error ? err : new Error("Failed to queue welcome email");
  }
}

async function createOrGetUser(input: {
  email: string;
  full_name: string;
  role: AppRole;
  organization_name?: string | null;
}) {
  // Try to create the user with the temporary password and confirmed email
  // (so they can sign in immediately from the app).
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      organization_name: input.organization_name ?? null,
      invited_role: input.role,
      password_set: false,
    },
  });

  if (created?.user) {
    return { userId: created.user.id, isNew: true };
  }

  // If user already exists, look them up by email.
  const msg = createErr?.message?.toLowerCase() ?? "";
  if (
    createErr &&
    (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
  ) {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .maybeSingle();
    if (existing) return { userId: existing.id, isNew: false };
  }

  if (createErr) throw new Error(createErr.message);
  throw new Error("Failed to create user");
}

async function setDefaultPasswordAndMetadata(input: {
  userId: string;
  email: string;
  full_name: string;
  role: AppRole;
  organization_name?: string | null;
}) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(input.userId, {
    email: input.email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      organization_name: input.organization_name ?? null,
      invited_role: input.role,
      password_set: false,
    },
  });
  if (error) throw new Error(error.message);
}

export async function inviteUserAdmin(input: {
  email: string;
  full_name: string;
  role: AppRole;
  organization_name?: string | null;
  redirect_to?: string | null;
}) {
  const { userId } = await createOrGetUser(input);

  await setDefaultPasswordAndMetadata({
    userId,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    organization_name: input.organization_name ?? null,
  });

  await supabaseAdmin
    .from("profiles")
    .update({
      full_name: input.full_name,
      ...(input.organization_name ? { organization_name: input.organization_name } : {}),
    })
    .eq("id", userId);

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", input.role)
    .maybeSingle();
  if (!existingRole) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: input.role });
    if (roleError) throw new Error(roleError.message);
  }

  await sendWelcomeEmail({ email: input.email, full_name: input.full_name, role: input.role });

  return { user_id: userId, email: input.email };
}

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

  const organizationName = input.role === "client" ? property.client_organization : null;
  const { userId } = await createOrGetUser({
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    organization_name: organizationName,
  });

  await setDefaultPasswordAndMetadata({
    userId,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    organization_name: organizationName,
  });

  await supabaseAdmin
    .from("profiles")
    .update({
      full_name: input.full_name,
      ...(input.role === "client" ? { organization_name: property.client_organization } : {}),
    })
    .eq("id", userId);

  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", input.role)
    .maybeSingle();
  if (!existingRole) {
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: input.role });
  }

  const { data: existingAssignment } = await supabaseAdmin
    .from("property_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (!existingAssignment) {
    const { error: assignErr } = await supabaseAdmin
      .from("property_assignments")
      .insert({ user_id: userId, property_id: property.id, role_on_property: input.role });
    if (assignErr) throw new Error(assignErr.message);
  }

  await sendWelcomeEmail({ email: input.email, full_name: input.full_name, role: input.role });

  return { user_id: userId, email: input.email };
}

export async function listUsersByRoleAdmin(role: "client" | "supervisor", propertyId: string) {
  const { data: roleRows, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", role);
  if (error) throw new Error(error.message);
  const ids = (roleRows ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];

  const [{ data: profiles }, { data: assigned }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email, organization_name").in("id", ids),
    supabaseAdmin
      .from("property_assignments")
      .select("user_id")
      .eq("property_id", propertyId)
      .in("user_id", ids),
  ]);
  const assignedSet = new Set((assigned ?? []).map((a) => a.user_id));
  return (profiles ?? []).map((p) => ({ ...p, assigned: assignedSet.has(p.id) }));
}
