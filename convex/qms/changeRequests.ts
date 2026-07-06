import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let crs = await ctx.db.query("qms_change_requests").collect();
    if (status) crs = crs.filter((c) => c.status === status);
    return crs.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = query({
  args: { crId: v.id("qms_change_requests") },
  handler: async (ctx, { crId }) => ctx.db.get(crId),
});

export const create = mutation({
  args: {
    crNumber: v.string(),
    title: v.string(),
    description: v.string(),
    impactAssessment: v.string(),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_change_requests", { ...rest, status: "open", createdById, createdAt: now, updatedAt: now });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_change_requests", id, null, rest);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    crId: v.id("qms_change_requests"),
    status: v.union(v.literal("open"), v.literal("approved"), v.literal("executed"), v.literal("rejected")),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { crId, status, updatedById }) => {
    const prev = await ctx.db.get(crId);
    const now = new Date().toISOString();
    await ctx.db.patch(crId, { status, updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "STATUS_CHANGE", "qms_change_requests", crId, prev, { status });
  },
});
