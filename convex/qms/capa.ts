import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let capas = await ctx.db.query("qms_capas").collect();
    if (status) capas = capas.filter((c) => c.status === status);
    return capas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const getById = query({
  args: { capaId: v.id("qms_capas") },
  handler: async (ctx, { capaId }) => {
    const capa = await ctx.db.get(capaId);
    if (!capa) return null;
    const actions = await ctx.db
      .query("qms_capa_action_items")
      .withIndex("by_capa", (q) => q.eq("capaId", capaId))
      .collect();
    return { ...capa, actionItems: actions };
  },
});

export const getSummaryStats = query({
  args: {},
  handler: async (ctx) => {
    const capas = await ctx.db.query("qms_capas").collect();
    const now = new Date();
    return {
      total: capas.length,
      open: capas.filter((c) => c.status !== "closed").length,
      overdue: capas.filter(
        (c) => c.status !== "closed" && new Date(c.verificationDate) < now
      ).length,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    capaNumber: v.string(),
    source: v.string(),
    description: v.string(),
    containmentAction: v.string(),
    rootCauseMethod: v.string(),
    rootCauseAnalysis: v.string(),
    effectivenessPlan: v.string(),
    verificationDate: v.string(),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_capas", {
      ...rest,
      status: "initiated",
      createdById,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_capas", id, null, rest);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    capaId: v.id("qms_capas"),
    status: v.union(
      v.literal("initiated"),
      v.literal("investigating"),
      v.literal("actions-active"),
      v.literal("verification"),
      v.literal("closed")
    ),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { capaId, status, updatedById }) => {
    const prev = await ctx.db.get(capaId);
    if (!prev) throw new Error("CAPA not found");
    const now = new Date().toISOString();
    await ctx.db.patch(capaId, { status, updatedAt: now });
    await writeAuditLog(ctx.db, updatedById, "STATUS_CHANGE", "qms_capas", capaId, prev, { status });

    // When all actions resolve and status moves to verification, schedule 60-day effectiveness check
    if (status === "verification") {
      await ctx.scheduler.runAfter(
        60 * 24 * 60 * 60 * 1000,
        internal.qms.capa.triggerVerificationEvaluation,
        { capaId }
      );
    }
  },
});

export const addActionItem = mutation({
  args: {
    capaId: v.id("qms_capas"),
    task: v.string(),
    assignedToId: v.id("users"),
    dueDate: v.string(),
    createdById: v.id("users"),
  },
  handler: async (ctx, { capaId, task, assignedToId, dueDate, createdById }) => {
    const id = await ctx.db.insert("qms_capa_action_items", {
      capaId,
      task,
      assignedToId,
      dueDate,
      status: "pending",
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_capa_action_items", id, null, { capaId, task, assignedToId, dueDate });
    return id;
  },
});

export const completeActionItem = mutation({
  args: { actionItemId: v.id("qms_capa_action_items"), userId: v.id("users") },
  handler: async (ctx, { actionItemId, userId }) => {
    const prev = await ctx.db.get(actionItemId);
    const now = new Date().toISOString();
    await ctx.db.patch(actionItemId, { status: "completed", completedAt: now });
    await writeAuditLog(ctx.db, userId, "COMPLETE", "qms_capa_action_items", actionItemId, prev, { status: "completed" });

    // Auto-advance CAPA if all actions are now complete
    if (!prev) return;
    const allActions = await ctx.db
      .query("qms_capa_action_items")
      .withIndex("by_capa", (q) => q.eq("capaId", prev.capaId))
      .collect();

    const allDone = allActions.every((a) => a._id === actionItemId || a.status === "completed");
    if (allDone) {
      const capa = await ctx.db.get(prev.capaId);
      if (capa && capa.status === "actions-active") {
        await ctx.db.patch(prev.capaId, { status: "verification", updatedAt: now });
        await ctx.scheduler.runAfter(
          60 * 24 * 60 * 60 * 1000,
          internal.qms.capa.triggerVerificationEvaluation,
          { capaId: prev.capaId }
        );
      }
    }
  },
});

export const closeWithEffectiveness = mutation({
  args: {
    capaId: v.id("qms_capas"),
    isEffective: v.boolean(),
    closedById: v.id("users"),
  },
  handler: async (ctx, { capaId, isEffective, closedById }) => {
    const prev = await ctx.db.get(capaId);
    const now = new Date().toISOString();
    await ctx.db.patch(capaId, { isEffective, status: "closed", closedById, closedAt: now, updatedAt: now });
    await writeAuditLog(ctx.db, closedById, "CLOSE", "qms_capas", capaId, prev, { isEffective, status: "closed" });
  },
});

// ── Scheduler callback ────────────────────────────────────────────────────────

export const triggerVerificationEvaluation = internalMutation({
  args: { capaId: v.id("qms_capas") },
  handler: async (ctx, { capaId }) => {
    const capa = await ctx.db.get(capaId);
    if (!capa || capa.status !== "verification") return;
    // Notify QMS Manager to complete effectiveness review (real: send email via gateway)
    await writeAuditLog(ctx.db, "system", "VERIFICATION_DUE", "qms_capas", capaId, null, { message: "60-day effectiveness evaluation period elapsed" });
  },
});
