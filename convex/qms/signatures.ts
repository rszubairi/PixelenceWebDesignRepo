import { query, action, mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { writeAuditLog } from "./auditTrail";

const GATEWAY_URL = process.env.BACKEND_GATEWAY_URL ?? "http://localhost:3001";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getByDocument = query({
  args: { documentId: v.id("qms_documents") },
  handler: async (ctx, { documentId }) =>
    ctx.db.query("qms_electronic_signatures").withIndex("by_document", (q) => q.eq("documentId", documentId)).collect(),
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db.query("qms_electronic_signatures").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
});

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Dual-factor e-signature: verifies password via the Express gateway (bcryptjs compare),
 * then records the signature and advances the target workflow.
 * Implements FDA 21 CFR Part 11 §11.50 requirements.
 */
export const verifyAndApply = action({
  args: {
    userId: v.id("users"),
    password: v.string(),
    meaning: v.string(),
    // Target (exactly one must be provided)
    documentId: v.optional(v.id("qms_documents")),
    changeRequestId: v.optional(v.id("qms_change_requests")),
    capaId: v.optional(v.id("qms_capas")),
    trainingRecordId: v.optional(v.id("qms_training_records")),
    dhfItemId: v.optional(v.id("qms_dhf_items")),
  },
  handler: async (ctx, { userId, password, meaning, ...targets }) => {
    // Step 1: Verify credentials against Express gateway
    const verifyRes = await fetch(`${GATEWAY_URL}/api/qms/esign/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    if (!verifyRes.ok) {
      const body = await verifyRes.json().catch(() => ({}));
      throw new Error(body.error ?? "Electronic signature verification failed");
    }

    const { signatureHash } = await verifyRes.json();

    // Step 2: Persist the electronic signature record
    await ctx.runMutation(api.qms.signatures.recordSignature, {
      userId,
      signedAt: new Date().toISOString(),
      meaning,
      signatureHash,
      ...targets,
    });

    // Step 3: Advance the corresponding workflow
    if (targets.documentId) {
      await ctx.runMutation(api.qms.documents.applySignatureAndPublish, {
        docId: targets.documentId,
        signatureHash,
        meaning,
        approvedById: userId,
      });
    }

    return { success: true, signatureHash };
  },
});

// ── Mutation (internal record) ────────────────────────────────────────────────

export const recordSignature = mutation({
  args: {
    userId: v.id("users"),
    signedAt: v.string(),
    meaning: v.string(),
    signatureHash: v.string(),
    documentId: v.optional(v.id("qms_documents")),
    changeRequestId: v.optional(v.id("qms_change_requests")),
    capaId: v.optional(v.id("qms_capas")),
    trainingRecordId: v.optional(v.id("qms_training_records")),
    dhfItemId: v.optional(v.id("qms_dhf_items")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("qms_electronic_signatures", args);
    await writeAuditLog(ctx.db, args.userId, "ESIGN", "qms_electronic_signatures", id, null, {
      meaning: args.meaning,
      documentId: args.documentId,
      capaId: args.capaId,
    });
    return id;
  },
});
