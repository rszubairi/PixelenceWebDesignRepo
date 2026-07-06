import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let complaints = await ctx.db.query("qms_complaints").collect();
    if (status) complaints = complaints.filter((c) => c.status === status);
    return complaints.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = query({
  args: { complaintId: v.id("qms_complaints") },
  handler: async (ctx, { complaintId }) => ctx.db.get(complaintId),
});

export const getSummaryStats = query({
  args: {},
  handler: async (ctx) => {
    const complaints = await ctx.db.query("qms_complaints").collect();
    return {
      total: complaints.length,
      open: complaints.filter((c) => c.status !== "resolved").length,
      adverseEvents: complaints.filter((c) => c.adverseEvent).length,
      mdrReportable: complaints.filter((c) => c.mdrReportable).length,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    complaintNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    description: v.string(),
    adverseEvent: v.boolean(),
    seriousInjury: v.boolean(),
    reportReferenceId: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const mdrReportable = rest.adverseEvent || rest.seriousInjury;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_complaints", {
      ...rest,
      mdrReportable,
      status: "received",
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, createdById ?? "system", "CREATE", "qms_complaints", id, null, { ...rest, mdrReportable });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    complaintId: v.id("qms_complaints"),
    status: v.union(
      v.literal("received"),
      v.literal("investigating"),
      v.literal("capa-raised"),
      v.literal("resolved")
    ),
    resolution: v.optional(v.string()),
    capaId: v.optional(v.id("qms_capas")),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { complaintId, status, resolution, capaId, updatedById }) => {
    const prev = await ctx.db.get(complaintId);
    const now = new Date().toISOString();
    await ctx.db.patch(complaintId, {
      status,
      ...(resolution && { resolution }),
      ...(capaId && { capaId }),
      ...(status === "resolved" && { resolvedAt: now }),
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, updatedById, "UPDATE", "qms_complaints", complaintId, prev, { status, resolution });
  },
});
