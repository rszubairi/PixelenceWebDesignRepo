import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let risks = await ctx.db.query("qms_risks").collect();
    if (status) risks = risks.filter((r) => r.status === status);
    return risks.sort((a, b) => b.preRpn - a.preRpn);
  },
});

export const getById = query({
  args: { riskId: v.id("qms_risks") },
  handler: async (ctx, { riskId }) => ctx.db.get(riskId),
});

export const getSummaryStats = query({
  args: {},
  handler: async (ctx) => {
    const risks = await ctx.db.query("qms_risks").collect();
    return {
      total: risks.length,
      open: risks.filter((r) => r.status === "open").length,
      mitigated: risks.filter((r) => r.status === "mitigated").length,
      acceptable: risks.filter((r) => r.status === "acceptable").length,
      highRpn: risks.filter((r) => r.preRpn >= 50).length,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    riskNumber: v.string(),
    hazard: v.string(),
    consequence: v.string(),
    preSeverity: v.number(),
    preProbability: v.number(),
    preDetectability: v.number(),
    mitigation: v.string(),
    mitigationRef: v.optional(v.string()),
    postSeverity: v.number(),
    postProbability: v.number(),
    postDetectability: v.number(),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const preRpn = rest.preSeverity * rest.preProbability * rest.preDetectability;
    const postRpn = rest.postSeverity * rest.postProbability * rest.postDetectability;
    const now = new Date().toISOString();

    const id = await ctx.db.insert("qms_risks", {
      ...rest,
      preRpn,
      postRpn,
      status: "open",
      createdById,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_risks", id, null, { ...rest, preRpn, postRpn });
    return id;
  },
});

export const update = mutation({
  args: {
    riskId: v.id("qms_risks"),
    hazard: v.optional(v.string()),
    consequence: v.optional(v.string()),
    preSeverity: v.optional(v.number()),
    preProbability: v.optional(v.number()),
    preDetectability: v.optional(v.number()),
    mitigation: v.optional(v.string()),
    mitigationRef: v.optional(v.string()),
    postSeverity: v.optional(v.number()),
    postProbability: v.optional(v.number()),
    postDetectability: v.optional(v.number()),
    status: v.optional(v.union(v.literal("open"), v.literal("mitigated"), v.literal("acceptable"))),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { riskId, updatedById, ...patch }) => {
    const prev = await ctx.db.get(riskId);
    if (!prev) throw new Error("Risk not found");

    const merged = { ...prev, ...patch };
    const preRpn = merged.preSeverity * merged.preProbability * merged.preDetectability;
    const postRpn = merged.postSeverity * merged.postProbability * merged.postDetectability;

    const now = new Date().toISOString();
    await ctx.db.patch(riskId, { ...patch, preRpn, postRpn, updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "UPDATE", "qms_risks", riskId, prev, { ...patch, preRpn, postRpn });
  },
});
