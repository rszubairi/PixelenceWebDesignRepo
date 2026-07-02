import { query, mutation, action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { writeAuditLog } from "./auditTrail";

// ── Queries ──────────────────────────────────────────────────────────────────

export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { type, status }) => {
    let docs = await ctx.db.query("qms_documents").collect();
    if (type) docs = docs.filter((d) => d.type === type);
    if (status) docs = docs.filter((d) => d.status === status);
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const getById = query({
  args: { docId: v.id("qms_documents") },
  handler: async (ctx, { docId }) => ctx.db.get(docId),
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createDraft = mutation({
  args: {
    title: v.string(),
    docNumber: v.string(),
    type: v.union(
      v.literal("sop"),
      v.literal("manual"),
      v.literal("specification"),
      v.literal("policy"),
      v.literal("protocol")
    ),
    contentUrl: v.optional(v.string()),
    changeRequestId: v.optional(v.id("qms_change_requests")),
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_documents", {
      ...args,
      version: "0.1",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx.db, args.createdById, "CREATE", "qms_documents", id, null, args);
    return id;
  },
});

export const submitForReview = mutation({
  args: {
    docId: v.id("qms_documents"),
    reviewers: v.array(v.id("users")),
    requestedById: v.id("users"),
  },
  handler: async (ctx, { docId, reviewers, requestedById }) => {
    const prev = await ctx.db.get(docId);
    const now = new Date().toISOString();
    await ctx.db.patch(docId, { status: "in-review", reviewers, updatedAt: now });
    await writeAuditLog(ctx.db, requestedById, "SUBMIT_FOR_REVIEW", "qms_documents", docId, prev, { status: "in-review", reviewers });
  },
});

export const submitForApproval = mutation({
  args: {
    docId: v.id("qms_documents"),
    requestedById: v.id("users"),
  },
  handler: async (ctx, { docId, requestedById }) => {
    const prev = await ctx.db.get(docId);
    const now = new Date().toISOString();
    await ctx.db.patch(docId, { status: "awaiting-approval", updatedAt: now });
    await writeAuditLog(ctx.db, requestedById, "SUBMIT_FOR_APPROVAL", "qms_documents", docId, prev, { status: "awaiting-approval" });
  },
});

export const applySignatureAndPublish = mutation({
  args: {
    docId: v.id("qms_documents"),
    signatureHash: v.string(),
    meaning: v.string(),
    approvedById: v.id("users"),
  },
  handler: async (ctx, { docId, signatureHash, meaning, approvedById }) => {
    const prev = await ctx.db.get(docId);
    if (!prev) throw new Error("Document not found");
    if (prev.status !== "awaiting-approval") throw new Error("Document is not pending approval");

    const now = new Date().toISOString();
    // Increment version to major release (e.g. 0.x → 1.0)
    const majorVersion = (Math.floor(parseFloat(prev.version)) + 1) + ".0";

    await ctx.db.patch(docId, {
      status: "effective",
      version: majorVersion,
      approvedById,
      approvedAt: now,
      updatedAt: now,
    });

    // Record the electronic signature
    await ctx.db.insert("qms_electronic_signatures", {
      userId: approvedById,
      signedAt: now,
      meaning,
      signatureHash,
      documentId: docId,
    });

    await writeAuditLog(ctx.db, approvedById, "APPROVE", "qms_documents", docId, prev, { status: "effective", version: majorVersion });

    // Reset training records for any programs linked to this SOP
    await ctx.scheduler.runAfter(0, internal.qms.scheduler.resetTrainingOnNewSopVersion, { documentId: docId });
  },
});

export const archive = mutation({
  args: { docId: v.id("qms_documents"), userId: v.id("users") },
  handler: async (ctx, { docId, userId }) => {
    const prev = await ctx.db.get(docId);
    const now = new Date().toISOString();
    await ctx.db.patch(docId, { status: "archived", updatedAt: now });
    await writeAuditLog(ctx.db, userId, "ARCHIVE", "qms_documents", docId, prev, { status: "archived" });
  },
});

// ── Scheduler callback ────────────────────────────────────────────────────────

export const reviewReminderAction = internalMutation({
  args: { docId: v.id("qms_documents"), reviewers: v.array(v.id("users")) },
  handler: async (ctx, { docId, reviewers }) => {
    const doc = await ctx.db.get(docId);
    if (!doc || doc.status !== "in-review") return;
    // In a real system: send email via Express gateway
    // Logged as a system action (userId = "system")
    await writeAuditLog(ctx.db, "system", "REVIEW_REMINDER_SENT", "qms_documents", docId, null, { reviewers });
  },
});

// ── Action: request approval with scheduler ───────────────────────────────────

export const requestApproval = action({
  args: {
    docId: v.id("qms_documents"),
    reviewers: v.array(v.id("users")),
    requestedById: v.id("users"),
  },
  handler: async (ctx, { docId, reviewers, requestedById }) => {
    await ctx.runMutation(api.qms.documents.submitForReview, { docId, reviewers, requestedById });
    // Schedule 7-day reminder
    await ctx.scheduler.runAfter(
      7 * 24 * 60 * 60 * 1000,
      internal.qms.documents.reviewReminderAction,
      { docId, reviewers }
    );
  },
});
