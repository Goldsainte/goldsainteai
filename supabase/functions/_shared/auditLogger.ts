import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin or sensitive action to the audit log
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      changes: entry.changes,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });

    if (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw - audit logging failures shouldn't break the main operation
    }
  } catch (error) {
    console.error("Exception during audit logging:", error);
  }
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  supabase: SupabaseClient,
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<any[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch resource audit logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Search audit logs with filters
 */
export async function searchAuditLogs(
  supabase: SupabaseClient,
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<any[]> {
  let query = supabase.from("audit_logs").select("*");

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  query = query.order("created_at", { ascending: false }).limit(filters.limit || 100);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to search audit logs:", error);
    return [];
  }

  return data || [];
}
