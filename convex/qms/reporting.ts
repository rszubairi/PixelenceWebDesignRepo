import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Aggregated reporting queries for the QMS analytics dashboard.
 * All queries are read-only; no audit log is required.
 */

export const executiveSummary = query({
  args: {},
  handler: async (ctx) => {
    const [docs, capas, complaints, risks, training, audits, suppliers] = await Promise.all([
      ctx.db.query("qms_documents").collect(),
      ctx.db.query("qms_capas").collect(),
      ctx.db.query("qms_complaints").collect(),
      ctx.db.query("qms_risks").collect(),
      ctx.db.query("qms_training_records").collect(),
      ctx.db.query("qms_audits").collect(),
      ctx.db.query("qms_suppliers").collect(),
    ]);

    const now = new Date();

    // Document metrics
    const docsEffective = docs.filter((d) => d.status === "effective").length;
    const docsNearReview = docs.filter((d) => {
      if (d.status !== "effective" || !d.approvedAt) return false;
      const age = now.getTime() - new Date(d.approvedAt).getTime();
      return age > (3 * 365 - 30) * 24 * 60 * 60 * 1000; // within 30 days of 3-year review
    }).length;

    // CAPA metrics
    const capasOpen = capas.filter((c) => c.status !== "closed").length;
    const capasOverdue = capas.filter(
      (c) => c.status !== "closed" && new Date(c.verificationDate) < now
    ).length;

    // Root cause distribution
    const rcaDist: Record<string, number> = {};
    for (const c of capas) {
      rcaDist[c.rootCauseMethod] = (rcaDist[c.rootCauseMethod] ?? 0) + 1;
    }

    // Complaint metrics
    const complaintsOpen = complaints.filter((c) => c.status !== "resolved").length;
    const mdrCount = complaints.filter((c) => c.mdrReportable).length;

    // Risk metrics
    const highRpn = risks.filter((r) => r.preRpn >= 50).length;
    const openRisks = risks.filter((r) => r.status === "open").length;

    // Training compliance
    const completedRecords = training.filter((t) => t.status === "completed" && t.isPassed).length;
    const trainingCompliancePct = training.length > 0
      ? Math.round((completedRecords / training.length) * 100)
      : 100;

    // Audit metrics
    const upcomingAudits = audits.filter(
      (a) => a.status === "scheduled" && new Date(a.targetDate) > now
    ).length;
    const openFindings = 0; // Computed per-audit; kept simple here

    // Supplier metrics
    const criticalSuppliers = suppliers.filter((s) => s.criticality === "critical").length;
    const suspendedSuppliers = suppliers.filter((s) => s.status === "suspended").length;

    return {
      documents: { effective: docsEffective, total: docs.length, nearReview: docsNearReview },
      capas: { open: capasOpen, overdue: capasOverdue, total: capas.length, rcaDist },
      complaints: { open: complaintsOpen, mdrReportable: mdrCount, total: complaints.length },
      risks: { highRpn, open: openRisks, total: risks.length },
      training: { compliancePct: trainingCompliancePct, total: training.length, completed: completedRecords },
      audits: { upcoming: upcomingAudits, total: audits.length },
      suppliers: { critical: criticalSuppliers, suspended: suspendedSuppliers, total: suppliers.length },
    };
  },
});

export const documentAgeMatrix = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("qms_documents").collect();
    const now = new Date();

    return docs
      .filter((d) => d.status === "effective")
      .map((d) => {
        const effectiveDate = new Date(d.approvedAt ?? d.createdAt);
        const ageMonths = Math.floor((now.getTime() - effectiveDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const reviewDueMonths = 36 - ageMonths; // 3-year periodic review
        return {
          docNumber: d.docNumber,
          title: d.title,
          version: d.version,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
          ageMonths,
          reviewDueMonths,
          overdue: reviewDueMonths < 0,
          warning: reviewDueMonths >= 0 && reviewDueMonths <= 2,
        };
      })
      .sort((a, b) => a.reviewDueMonths - b.reviewDueMonths);
  },
});

export const capaAgeTrend = query({
  args: {},
  handler: async (ctx) => {
    const capas = await ctx.db.query("qms_capas").collect();
    const now = new Date();

    return capas.map((c) => {
      const openedDate = new Date(c.createdAt);
      const ageDays = Math.floor((now.getTime() - openedDate.getTime()) / (24 * 60 * 60 * 1000));
      return {
        capaNumber: c.capaNumber,
        status: c.status,
        source: c.source,
        ageDays,
        isOverdue: c.status !== "closed" && new Date(c.verificationDate) < now,
        closedAt: c.closedAt,
      };
    });
  },
});
