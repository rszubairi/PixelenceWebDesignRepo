import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listRequirements = query({
  args: { type: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, { type, status }) => {
    let reqs = await ctx.db.query("qms_requirements").collect();
    if (type) reqs = reqs.filter((r) => r.type === type);
    if (status) reqs = reqs.filter((r) => r.status === status);
    return reqs.sort((a, b) => a.reqNumber.localeCompare(b.reqNumber));
  },
});

export const getById = query({
  args: { reqId: v.id("qms_requirements") },
  handler: async (ctx, { reqId }) => ctx.db.get(reqId),
});

export const checkTraceMatrix = query({
  args: {},
  handler: async (ctx) => {
    const requirements = await ctx.db.query("qms_requirements").collect();
    const traces = await ctx.db.query("qms_requirement_traces").collect();

    const traceMap: Record<string, string[]> = {};
    for (const t of traces) {
      if (!traceMap[t.sourceId]) traceMap[t.sourceId] = [];
      traceMap[t.sourceId].push(t.targetId);
    }

    return requirements.map((req) => ({
      ...req,
      linkedTo: traceMap[req._id] ?? [],
      hasTestRef: !!req.verificationRef,
      isOrphan: !req.verificationRef && (traceMap[req._id] ?? []).length === 0,
    }));
  },
});

export const listTraces = query({
  args: { sourceId: v.optional(v.id("qms_requirements")) },
  handler: async (ctx, { sourceId }) => {
    if (sourceId) {
      return ctx.db
        .query("qms_requirement_traces")
        .withIndex("by_source", (q) => q.eq("sourceId", sourceId))
        .collect();
    }
    return ctx.db.query("qms_requirement_traces").collect();
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createRequirement = mutation({
  args: {
    reqNumber: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("prd"), v.literal("srs"), v.literal("software-spec")),
    source: v.string(),
    parentId: v.optional(v.id("qms_requirements")),
    verificationRef: v.optional(v.string()),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_requirements", { ...rest, status: "draft", createdAt: now, updatedAt: now });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_requirements", id, null, rest);
    return id;
  },
});

export const addTrace = mutation({
  args: {
    sourceId: v.id("qms_requirements"),
    targetId: v.id("qms_requirements"),
    traceType: v.optional(v.string()),
    codeRef: v.optional(v.string()),
    testRef: v.optional(v.string()),
    createdById: v.id("users"),
  },
  handler: async (ctx, { createdById, ...rest }) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_requirement_traces", { ...rest, createdAt: now });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_requirement_traces", id, null, rest);
    return id;
  },
});

export const updateRequirement = mutation({
  args: {
    reqId: v.id("qms_requirements"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    verificationRef: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("approved"), v.literal("deprecated"))),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { reqId, updatedById, ...patch }) => {
    const prev = await ctx.db.get(reqId);
    const now = new Date().toISOString();
    await ctx.db.patch(reqId, { ...patch, updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "UPDATE", "qms_requirements", reqId, prev, patch);
  },
});
