import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: { status: v.optional(v.string()), type: v.optional(v.string()) },
  handler: async (ctx, { status, type }) => {
    let audits = await ctx.db.query("qms_audits").collect();
    if (status) audits = audits.filter((a) => a.status === status);
    if (type) audits = audits.filter((a) => a.type === type);
    return audits.sort((a, b) => b.targetDate.localeCompare(a.targetDate));
  },
});

export const getById = query({
  args: { auditId: v.id("qms_audits") },
  handler: async (ctx, { auditId }) => {
    const audit = await ctx.db.get(auditId);
    if (!audit) return null;
    const findings = await ctx.db
      .query("qms_audit_findings")
      .withIndex("by_audit", (q) => q.eq("auditId", auditId))
      .collect();
    return { ...audit, findings };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    auditNumber: v.string(),
    type: v.union(v.literal("internal"), v.literal("external"), v.literal("supplier")),
    scope: v.string(),
    leadAuditor: v.string(),
    targetDate: v.string(),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_audits", {
      ...rest,
      status: "scheduled",
      createdById,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_audits", id, null, rest);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    auditId: v.id("qms_audits"),
    status: v.union(v.literal("scheduled"), v.literal("in-progress"), v.literal("completed")),
    minutesUrl: v.optional(v.string()),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { auditId, status, minutesUrl, updatedById }) => {
    const prev = await ctx.db.get(auditId);
    const now = new Date().toISOString();
    await ctx.db.patch(auditId, { status, ...(minutesUrl && { minutesUrl }), updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "UPDATE", "qms_audits", auditId, prev, { status });
  },
});

export const addFinding = mutation({
  args: {
    auditId: v.id("qms_audits"),
    severity: v.union(v.literal("major-nc"), v.literal("minor-nc"), v.literal("ofi")),
    description: v.string(),
    createdById: v.id("users"),
    autoRaiseCapa: v.optional(v.boolean()),
  },
  handler: async (ctx, { auditId, severity, description, createdById, autoRaiseCapa }) => {
    const now = new Date().toISOString();
    const findingId = await ctx.db.insert("qms_audit_findings", { auditId, severity, description, createdAt: now });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_audit_findings", findingId, null, { auditId, severity, description });

    // Auto-create CAPA stub for major nonconformances
    if (severity === "major-nc" && autoRaiseCapa) {
      const audit = await ctx.db.get(auditId);
      const capaCount = (await ctx.db.query("qms_capas").collect()).length + 1;
      const year = new Date().getFullYear();
      const capaId = await ctx.db.insert("qms_capas", {
        capaNumber: `CAPA-${year}-${String(capaCount).padStart(3, "0")}`,
        source: `Audit ${audit?.auditNumber ?? auditId}`,
        description,
        containmentAction: "Pending investigation",
        rootCauseMethod: "5 Whys",
        rootCauseAnalysis: "TBD",
        effectivenessPlan: "TBD",
        verificationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "initiated",
        createdById,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(findingId, { capaId });
      await writeAuditLog(ctx.db, createdById, "AUTO_CAPA", "qms_capas", capaId, null, { source: "audit-finding", findingId });
    }

    return findingId;
  },
});
