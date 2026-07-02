import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

export const list = query({
  args: { criticality: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, { criticality, status }) => {
    let suppliers = await ctx.db.query("qms_suppliers").collect();
    if (criticality) suppliers = suppliers.filter((s) => s.criticality === criticality);
    if (status) suppliers = suppliers.filter((s) => s.status === status);
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { supplierId: v.id("qms_suppliers") },
  handler: async (ctx, { supplierId }) => ctx.db.get(supplierId),
});

export const create = mutation({
  args: {
    name: v.string(),
    criticality: v.union(v.literal("critical"), v.literal("major"), v.literal("minor")),
    serviceProvided: v.string(),
    certificationUrl: v.optional(v.string()),
    certificationExpiry: v.optional(v.string()),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_suppliers", {
      ...rest,
      evaluationScore: 100,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_suppliers", id, null, rest);
    return id;
  },
});

export const update = mutation({
  args: {
    supplierId: v.id("qms_suppliers"),
    evaluationScore: v.optional(v.number()),
    status: v.optional(v.union(v.literal("approved"), v.literal("conditional"), v.literal("suspended"))),
    certificationUrl: v.optional(v.string()),
    certificationExpiry: v.optional(v.string()),
    lastAuditDate: v.optional(v.string()),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { supplierId, updatedById, ...patch }) => {
    const prev = await ctx.db.get(supplierId);
    const now = new Date().toISOString();
    await ctx.db.patch(supplierId, { ...patch, updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "UPDATE", "qms_suppliers", supplierId, prev, patch);
  },
});
