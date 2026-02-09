import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Imaging Jobs Management Functions
 * Queries and mutations for managing MRI imaging jobs
 */

// Get all jobs
export const getAllJobs = query({
  handler: async (ctx) => {
    return await ctx.db.query("jobs").order("desc").collect();
  },
});

// Get job by ID
export const getJobById = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

// Get jobs by patient
export const getJobsByPatient = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();
  },
});

// Get jobs by status
export const getJobsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Create new job
export const createJob = mutation({
  args: {
    jobId: v.string(),
    patientId: v.string(),
    appointmentId: v.optional(v.string()),
    studyType: v.string(),
    status: v.string(),
    priority: v.string(),
    dicomFiles: v.optional(v.array(v.string())),
    radiographerId: v.optional(v.string()),
    radiologistId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("jobs", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update job
export const updateJob = mutation({
  args: {
    id: v.id("jobs"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    dicomFiles: v.optional(v.array(v.string())),
    radiographerId: v.optional(v.string()),
    radiologistId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete job
export const deleteJob = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Get recent jobs (for dashboard)
export const getRecentJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db.query("jobs").order("desc").take(limit);
  },
});
