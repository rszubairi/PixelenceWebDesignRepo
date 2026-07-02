import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Writes an immutable audit log entry inside a Convex mutation context.
 * Call this helper from every QMS write mutation to satisfy 21 CFR Part 11 §11.10(e).
 * The qms_audit_logs table has NO update/delete mutations exposed — strictly append-only.
 */
export async function writeAuditLog(
  db: any,
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  previousState: any,
  newState: any,
  ipAddress: string = "server"
) {
  await db.insert("qms_audit_logs", {
    userId,
    action,
    tableName,
    recordId,
    previousState: previousState != null ? JSON.stringify(previousState) : undefined,
    newState: newState != null ? JSON.stringify(newState) : undefined,
    ipAddress,
    timestamp: new Date().toISOString(),
  });
}

export const list = query({
  args: {
    tableName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tableName, limit }) => {
    let q = tableName
      ? ctx.db.query("qms_audit_logs").withIndex("by_table", (q: any) => q.eq("tableName", tableName))
      : ctx.db.query("qms_audit_logs").withIndex("by_timestamp");

    const results = await q.order("desc").take(limit ?? 100);
    return results;
  },
});
