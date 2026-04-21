import { db } from "./db";
import { auditLogs } from "./db";

export interface AuditLogEntry {
  userId?: number | null;
  userEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode?: number | null;
}

/**
 * Log an admin action to the audit_logs table.
 * Errors are caught and logged to console — audit logging must never break the request.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      resourceType: entry.resourceType ?? null,
      resourceId: entry.resourceId ?? null,
      details: entry.details ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      statusCode: entry.statusCode ?? null,
    });
  } catch (error) {
    console.error("[audit] Failed to write audit log:", error);
  }
}

/**
 * Extract user-agent from request.
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent") ?? null;
}

/**
 * Parse resource type and ID from an admin API URL.
 * e.g. /api/admin/yachts/123 -> { resourceType: 'yacht', resourceId: '123' }
 * e.g. /api/admin/manufacturers -> { resourceType: 'manufacturer', resourceId: null }
 */
export function parseResourceFromUrl(url: string): {
  resourceType: string | null;
  resourceId: string | null;
} {
  try {
    const path = new URL(url).pathname;
    // Match /api/admin/<resource>[/<id>][/<action>]
    const match = path.match(/^\/api\/admin\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/);
    if (!match) return { resourceType: null, resourceId: null };

    let resourceType = match[1];
    // Singularize common resource names
    const singularMap: Record<string, string> = {
      yachts: "yacht",
      manufacturers: "manufacturer",
      reviews: "review",
      "spec-categories": "spec_category",
      prices: "price",
      corrections: "correction",
      media: "media",
      imports: "import",
      flags: "flag",
      newsletter: "newsletter_subscriber",
      "manufacturer-spotlights": "manufacturer_spotlight",
      "query-benchmark": "query_benchmark",
    };
    resourceType = singularMap[resourceType] ?? resourceType;

    // The second segment is typically the ID
    const segment2 = match[2];
    const segment3 = match[3];

    // If segment3 exists, segment2 is the ID and segment3 is a sub-action (e.g., "delete", "images")
    if (segment3) {
      return { resourceType, resourceId: segment2 };
    }
    // If segment2 is a number or UUID, it's an ID
    if (segment2 && /^\d+$/.test(segment2)) {
      return { resourceType, resourceId: segment2 };
    }
    return { resourceType, resourceId: null };
  } catch {
    return { resourceType: null, resourceId: null };
  }
}
