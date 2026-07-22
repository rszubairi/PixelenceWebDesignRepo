import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllReports = query({
  args: { hospitalId: v.optional(v.id("hospitals")) },
  handler: async (ctx, { hospitalId }) => {
    if (hospitalId) {
      return await ctx.db
        .query("reports")
        .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("reports").order("desc").collect();
  },
});

export const list = query({
  args: { hospitalId: v.optional(v.id("hospitals")) },
  handler: async (ctx, { hospitalId }) => {
    if (hospitalId) {
      return await ctx.db
        .query("reports")
        .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("reports").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db.query("reports").filter((q) =>
      q.eq(q.field("_id"), id)
    ).first();
  },
});

export const getReportById = query({
  args: { reportId: v.string() },
  handler: async (ctx, { reportId }) => {
    return await ctx.db.query("reports").filter((q) =>
      q.eq(q.field("_id"), reportId)
    ).first();
  },
});

export const getByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
  },
});

export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    appointmentId: v.id("appointments"),
    hospitalId: v.id("hospitals"),
    aiAnalysis: v.optional(v.object({
      sitesOfUptake: v.string(),
      natureOfUptake: v.string(),
      conclusion: v.string(),
      diagnosisRecommendations: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      ...args,
      radiologistApproved: false,
      status: "Analysis Complete",
      createdAt: new Date().toISOString(),
    });
  },
});

export const submitReport = mutation({
  args: {
    reportId: v.id("reports"),
    radiologistId: v.id("users"),
    radiologistComments: v.string(),
    approved: v.boolean(),
  },
  handler: async (ctx, { reportId, radiologistId, radiologistComments, approved }) => {
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found");

    const now = new Date().toISOString();
    await ctx.db.patch(reportId, {
      radiologistId,
      radiologistComments,
      radiologistApproved: approved,
      radiologistSubmittedAt: now,
      status: approved ? "Approved" : "Submitted",
      updatedAt: now,
    });

    // Update job status (jobId is optional on legacy reports)
    if (report.jobId) {
      await ctx.db.patch(report.jobId, {
        status: "Completed",
        updatedAt: now,
      });
    }

    // Update appointment status (appointmentId is optional on legacy reports)
    if (report.appointmentId) {
      await ctx.db.patch(report.appointmentId, {
        status: "Completed",
        updatedAt: now,
      });
    }

    // Notify the linked doctor
    const appointment = report.appointmentId ? await ctx.db.get(report.appointmentId) : null;
    if (appointment?.doctorId) {
      await ctx.db.insert("notifications", {
        userId: appointment.doctorId,
        type: "report_submitted",
        title: "Report Ready for Review",
        message: `The MRI report for ${appointment.patientName} has been submitted by the radiologist.`,
        referenceId: reportId,
        referenceType: "report",
        isRead: false,
        createdAt: now,
      });
    }

    // Notify hospital-admins in this hospital
    const hospitalAdmins = await ctx.db
      .query("users")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", report.hospitalId))
      .filter((q) => q.eq(q.field("role"), "hospital-admin"))
      .collect();

    for (const admin of hospitalAdmins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "report_submitted",
        title: "Report Submitted",
        message: `A report for patient ${appointment?.patientName ?? ""} has been submitted.`,
        referenceId: reportId,
        referenceType: "report",
        isRead: false,
        createdAt: now,
      });
    }

    return reportId;
  },
});

export const addDoctorComment = mutation({
  args: {
    reportId: v.id("reports"),
    doctorId: v.id("users"),
    doctorComments: v.string(),
  },
  handler: async (ctx, { reportId, doctorId, doctorComments }) => {
    await ctx.db.patch(reportId, {
      doctorId,
      doctorComments,
      doctorCommentedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getByDoctor = query({
  args: { doctorId: v.id("users") },
  handler: async (ctx, { doctorId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_doctor", (q) => q.eq("doctorId", doctorId))
      .order("desc")
      .collect();
  },
});
