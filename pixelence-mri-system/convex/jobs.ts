import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getRecentJobs = query({
  args: { limit: v.optional(v.number()), hospitalId: v.optional(v.id("hospitals")) },
  handler: async (ctx, { limit, hospitalId }) => {
    let jobs;
    if (hospitalId) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
        .order("desc")
        .collect();
    } else {
      jobs = await ctx.db.query("jobs").order("desc").collect();
    }
    return limit ? jobs.slice(0, limit) : jobs;
  },
});

export const getJobById = query({
  args: { jobId: v.string() },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.query("jobs").filter((q) =>
      q.eq(q.field("_id"), jobId)
    ).first();
  },
});

export const getByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, { appointmentId }) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", appointmentId))
      .first();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const completeUpload = mutation({
  args: {
    jobId: v.id("jobs"),
    storageIds: v.array(v.id("_storage")),
    studyType: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, storageIds, studyType }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");

    const dicomFiles = [];
    for (const storageId of storageIds) {
      const url = await ctx.storage.getUrl(storageId);
      if (url) dicomFiles.push(url);
    }
    const imageCount = dicomFiles.length;

    await ctx.db.patch(jobId, {
      dicomFiles,
      imageCount,
      studyType,
      status: "DICOM Uploaded",
      updatedAt: new Date().toISOString(),
    });

    // Update the linked appointment status (appointmentId is optional on legacy jobs)
    if (job.appointmentId) {
      await ctx.db.patch(job.appointmentId, {
        status: "DICOM Uploaded",
        updatedAt: new Date().toISOString(),
      });
    }

    // Notify assigned radiologist
    if (job.radiologistId) {
      const appointment = job.appointmentId ? await ctx.db.get(job.appointmentId) : null;
      await ctx.db.insert("notifications", {
        userId: job.radiologistId,
        type: "scan_ready",
        title: "New Scan Ready for Review",
        message: `DICOM images uploaded for patient ${appointment?.patientName ?? ""}. Please review.`,
        referenceId: jobId,
        referenceType: "job",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return jobId;
  },
});

export const saveEnhancedMri = mutation({
  args: {
    jobId: v.id("jobs"),
    enhancedMriPath: v.string(),
  },
  handler: async (ctx, { jobId, enhancedMriPath }) => {
    await ctx.db.patch(jobId, {
      enhancedMriPath,
      enhancedMriGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("Scheduled"),
      v.literal("DICOM Uploaded"),
      v.literal("Processing"),
      v.literal("Analysis Complete"),
      v.literal("Under Review"),
      v.literal("Completed"),
      v.literal("Failed")
    ),
  },
  handler: async (ctx, { jobId, status }) => {
    await ctx.db.patch(jobId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getByRadiologist = query({
  args: { radiologistId: v.id("users") },
  handler: async (ctx, { radiologistId }) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_radiologist", (q) => q.eq("radiologistId", radiologistId))
      .order("desc")
      .collect();
  },
});
