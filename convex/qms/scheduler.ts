/**
 * QMS Scheduler — Durable Convex scheduled functions.
 *
 * These replace external orchestration tools (Temporal, Celery) by using
 * Convex's `ctx.scheduler.runAfter` for durable, at-least-once delivery.
 *
 * Active workflows:
 *  1. Document review reminder    — fires 7 days after a doc enters "in-review"
 *     (wired in qms/documents.ts: requestApproval action)
 *  2. CAPA effectiveness check    — fires 60 days after CAPA enters "verification"
 *     (wired in qms/capa.ts: updateStatus + completeActionItem mutations)
 *  3. Periodic document review sweep  — daily check for docs past their periodic
 *     review date (see qms_documents: effective docs should be reviewed every 3 years)
 *  4. License/certification expiry alert — checks supplier certifications monthly
 */

import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { writeAuditLog } from "./auditTrail";

// ── 1. Daily: flag documents approaching their 3-year periodic review ─────────

export const sweepDocumentReviewDates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("qms_documents").collect();
    const now = new Date();
    const warningMs = 30 * 24 * 60 * 60 * 1000; // 30-day warning window
    const threeYearsMs = 3 * 365 * 24 * 60 * 60 * 1000;

    const dueForReview = docs.filter((doc) => {
      if (doc.status !== "effective") return false;
      const effectiveDate = new Date(doc.approvedAt ?? doc.createdAt);
      return now.getTime() - effectiveDate.getTime() > threeYearsMs - warningMs;
    });

    for (const doc of dueForReview) {
      await writeAuditLog(
        ctx.db,
        "system",
        "PERIODIC_REVIEW_DUE",
        "qms_documents",
        doc._id,
        null,
        { docNumber: doc.docNumber, version: doc.version }
      );
    }

    return { checked: docs.length, flagged: dueForReview.length };
  },
});

// ── 2. Monthly: flag supplier certifications expiring in < 60 days ────────────

export const sweepSupplierCertifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db.query("qms_suppliers").collect();
    const now = new Date();
    const warningMs = 60 * 24 * 60 * 60 * 1000;

    const expiring = suppliers.filter((s) => {
      if (!s.certificationExpiry) return false;
      const expiry = new Date(s.certificationExpiry);
      return expiry.getTime() - now.getTime() < warningMs && expiry > now;
    });

    for (const s of expiring) {
      await writeAuditLog(
        ctx.db,
        "system",
        "CERT_EXPIRY_WARNING",
        "qms_suppliers",
        s._id,
        null,
        { name: s.name, certificationExpiry: s.certificationExpiry }
      );
    }

    return { checked: suppliers.length, expiring: expiring.length };
  },
});

// ── 3. Training lapse sweep — triggered after SOP becomes effective ───────────
// When a document (SOP) reaches "effective", all training records for its
// training program are reset to "pending" so users must re-complete the course.

export const resetTrainingOnNewSopVersion = internalMutation({
  args: { documentId: v.id("qms_documents") },
  handler: async (ctx, { documentId }) => {
    // Find all training programs linked to this document
    const programs = await ctx.db
      .query("qms_training_programs")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    let resetCount = 0;
    for (const program of programs) {
      // Get all completed records for this program
      const records = await ctx.db
        .query("qms_training_records")
        .withIndex("by_user_program", (q) => q.eq("programId", program._id))
        .collect();

      for (const record of records) {
        if (record.status === "completed") {
          await ctx.db.patch(record._id, { status: "pending", isPassed: false });
          resetCount++;
        }
      }
    }

    await writeAuditLog(
      ctx.db,
      "system",
      "TRAINING_RESET_FOR_NEW_VERSION",
      "qms_documents",
      documentId,
      null,
      { programCount: programs.length, recordsReset: resetCount }
    );

    return { programCount: programs.length, recordsReset: resetCount };
  },
});
