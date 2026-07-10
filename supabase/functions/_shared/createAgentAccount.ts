// Shared helper: provisions a live travel-agent account from a verified
// agent_applications row. Used by:
//   - stripe-identity-webhook (auto-approval on Stripe Identity verified)
//   - approve-application (manual admin re-run / recovery)
//
// Idempotent: if `agent_applications.user_id` is already set the helper
// returns early. Wraps the create with rollback-on-failure (deletes the
// auth user it created if any downstream step throws), UNLESS the user
// already existed (we passed a pre-created user_id), in which case we
// never delete.

// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export interface AgentAccountResult {
  success: boolean;
  userId?: string;
  alreadyExists?: boolean;
  error?: string;
}

interface CreateAgentAccountOptions {
  /**
   * Optional admin actor id when invoked from `approve-application`.
   * Stored on the audit row + `agent_applications.admin_reviewer_id`.
   */
  adminUserId?: string;
  approvalNotes?: string;
  logger?: {
    info: (m: string, d?: any) => void;
    warn: (m: string, d?: any) => void;
    error: (m: string, d?: any) => void;
  };
}

function getClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Create the live agent account for a verified application.
 * Returns `{ success: true, alreadyExists: true }` on idempotent re-runs.
 */
export async function createAgentAccountFromApplication(
  applicationId: string,
  opts: CreateAgentAccountOptions = {},
): Promise<AgentAccountResult> {
  const supabase = getClient();
  const log = opts.logger ?? {
    info: (...a: any[]) => console.log("[createAgentAccount]", ...a),
    warn: (...a: any[]) => console.warn("[createAgentAccount]", ...a),
    error: (...a: any[]) => console.error("[createAgentAccount]", ...a),
  };

  // 1. Load application
  const { data: application, error: fetchError } = await supabase
    .from("agent_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) {
    log.error("Application not found", { applicationId, fetchError });
    return { success: false, error: "Application not found" };
  }

  // Idempotency: a travel_agents row is the true signal that provisioning
  // ran end-to-end. `agent_applications.user_id` is populated at signup
  // (before the application is filed), so it is NOT a safe proxy for
  // "already provisioned" — using it caused silent no-ops where profile
  // was set but travel_agents + user_roles were never created.
  if (application.user_id) {
    const { data: existingAgentRow } = await supabase
      .from("travel_agents")
      .select("id")
      .eq("user_id", application.user_id)
      .maybeSingle();
    if (existingAgentRow) {
      log.info("Account already provisioned for application", {
        applicationId,
        userId: application.user_id,
      });
      return {
        success: true,
        userId: application.user_id,
        alreadyExists: true,
      };
    }
    log.info("Application has user_id but no travel_agents row — provisioning", {
      applicationId,
      userId: application.user_id,
    });
  }

  // 2. Resolve / create the auth user.
  //    Fast path: if the application already has a user_id (agent signed up
  //    before applying — the standard flow today), reuse it and skip the
  //    auth lookup/create entirely.
  //    The agent may have signed up *before* applying (new flow — preferred,
  //    sets their own password). In that case we look them up by email.
  //    Otherwise we create the auth user now WITHOUT a password and rely on
  //    a password-reset email later (legacy fallback).
  let userId: string;
  let createdAuthUser = false;

  if (application.user_id) {
    userId = application.user_id;
    log.info("Reusing application.user_id for provisioning", { userId });
  } else {
  // Try to find existing auth user by email.
  // Primary lookup: profiles.email is unique and indexed — direct hit regardless
  // of how many users exist. Fallback: paginated listUsers filtered by email.
  // We never want to reach createUser when the agent already signed up via the form.
  let existingUser: { id: string } | null = null;
  try {
    const { data: profileByEmail } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", application.email)
      .maybeSingle();
    if (profileByEmail?.id) {
      existingUser = { id: profileByEmail.id };
    }
  } catch (e: any) {
    log.warn("profiles email lookup failed", { error: e?.message });
  }

  if (!existingUser) {
    try {
      // GoTrue listUsers supports a server-side email filter — exact match, no pagination needed.
      const { data: list } = await supabase.auth.admin.listUsers({
        // @ts-ignore – filter is supported by GoTrue admin API
        filter: `email.eq.${application.email}`,
        perPage: 1,
      });
      const match = list?.users?.find(
        (u: any) => (u.email || "").toLowerCase() === application.email.toLowerCase(),
      );
      if (match) existingUser = { id: match.id };
    } catch (e: any) {
      log.warn("listUsers email-filter lookup failed", { error: e?.message });
    }
  }

  if (existingUser) {
    userId = existingUser.id;
    log.info("Reusing existing auth user for application", { userId });
  } else {
    // Generate a random password the user will never use; they'll set their
    // own via the password-reset flow if they hit this path.
    // CRITICAL: bcrypt rejects passwords >72 bytes — GoTrue panics with 500.
    // A single UUID (36 chars) + a small entropy/complexity suffix stays well under.
    const placeholder = crypto.randomUUID().replace(/-/g, "") + "Aa1!"; // 36 bytes
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: application.email,
        password: placeholder,
        email_confirm: true,
        user_metadata: {
          first_name: application.first_name,
          last_name: application.last_name,
          account_type: "agent",
          application_id: applicationId,
        },
      });
    if (authError || !authData?.user) {
      log.error("Failed to create auth user", { error: authError });
      return {
        success: false,
        error: `Failed to create auth user: ${authError?.message}`,
      };
    }
    userId = authData.user.id;
    createdAuthUser = true;
    log.info("Auth user created", { userId });
  }
  } // end else (no application.user_id)

  // 3. Provision DB rows. Roll back the auth user iff WE created it.
  try {
    const nowIso = new Date().toISOString();

    // profiles
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: application.email,
        username: application.email.split("@")[0],
        first_name: application.first_name,
        last_name: application.last_name,
        phone: application.phone || null,
        account_type: "agent",
        role: "agent",
        is_verified: true,
        email_verified: true,
        identity_verified: true,
        // An auto-approved application IS the completed profile. Leaving this
        // false made post-auth routing bounce approved agents back to
        // /apply/agent instead of the Bureau.
        is_profile_complete: true,
        onboarding_completed: true,
        agent_verification_status: "verified",
        created_at: nowIso,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      throw new Error(`profiles upsert failed: ${profileError.message}`);
    }

    // travel_agents — only insert if not already there (safety for retries)
    const { data: existingAgent } = await supabase
      .from("travel_agents")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!existingAgent) {
      const specialties: string[] = Array.isArray(application.specialties)
        ? application.specialties
        : [];
      const bioParts: string[] = [];
      if (application.years_experience) {
        bioParts.push(`${application.years_experience} years of experience`);
      }
      if (specialties.length) {
        bioParts.push(`specializing in ${specialties.slice(0, 3).join(", ")}`);
      }
      const { error: agentError } = await supabase.from("travel_agents").insert({
        user_id: userId,
        agency_name: application.agency_name,
        business_type: application.business_type,
        bio: bioParts.join(" — ") || null,
        website: application.website || null,
        status: "active",
        is_accepting_requests: true,
        onboarded_at: nowIso,
        created_at: nowIso,
      });
      if (agentError) {
        throw new Error(`travel_agents insert failed: ${agentError.message}`);
      }
    }

    // user_roles — ignore conflict if role already assigned
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "agent",
    });
    if (roleError && roleError.code !== "23505") {
      log.warn("Failed to assign agent role (non-fatal)", { error: roleError });
    }

    // agent_applications — mark verified + linked
    const { error: updateError } = await supabase
      .from("agent_applications")
      .update({
        status: "verified",
        user_id: userId,
        admin_reviewer_id: opts.adminUserId ?? null,
        reviewed_at: nowIso,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", applicationId);
    if (updateError) {
      throw new Error(`application update failed: ${updateError.message}`);
    }

    // audit log
    await supabase.from("application_audit_log").insert({
      application_id: applicationId,
      application_type: "agent",
      action: "account_provisioned",
      actor_id: opts.adminUserId ?? null,
      actor_type: opts.adminUserId ? "admin" : "webhook",
      details: {
        user_id: userId,
        approval_notes: opts.approvalNotes ?? null,
        provisioned_at: nowIso,
        created_auth_user: createdAuthUser,
      },
      created_at: nowIso,
    });

    // in-app notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "application_update",
      title: "Your advisor account is live",
      message:
        "Your identity has been verified and your Goldsainte advisor account is now active.",
      priority: "high",
      created_at: nowIso,
    });

    log.info("Agent account provisioned", { applicationId, userId });
    return { success: true, userId };
  } catch (error: any) {
    log.error("Provisioning failed — attempting rollback", {
      error: error?.message,
      createdAuthUser,
    });
    if (createdAuthUser) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        log.info("Rolled back auth user", { userId });
      } catch (rbErr: any) {
        log.error("Rollback failed", { error: rbErr?.message });
      }
    }
    // Best-effort audit row for visibility of stuck verified rows.
    try {
      await supabase.from("application_audit_log").insert({
        application_id: applicationId,
        application_type: "agent",
        action: "account_provision_failed",
        actor_id: opts.adminUserId ?? null,
        actor_type: opts.adminUserId ? "admin" : "webhook",
        details: {
          error: String(error?.message || error),
          rolled_back_auth_user: createdAuthUser,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      /* swallow */
    }
    return { success: false, error: error?.message || "Unknown error" };
  }
}
