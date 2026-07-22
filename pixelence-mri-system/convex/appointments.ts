import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllAppointments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appointments").order("desc").collect();
  },
});

export const list = query({
  args: { hospitalId: v.optional(v.id("hospitals")) },
  handler: async (ctx, { hospitalId }) => {
    if (hospitalId) {
      return await ctx.db
        .query("appointments")
        .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("appointments").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db.query("appointments").filter((q) =>
      q.eq(q.field("_id"), id)
    ).first();
  },
});

export const getAppointmentById = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db.query("appointments").filter((q) =>
      q.eq(q.field("_id"), id)
    ).first();
  },
});

export const create = mutation({
  args: {
    patientName: v.string(),
    patientId: v.optional(v.string()),
    age: v.number(),
    gender: v.string(),
    complaint: v.string(),
    medicalHistory: v.optional(v.string()),
    causeOfReferral: v.optional(v.string()),
    referringPhysician: v.string(),
    scheduledDateTime: v.string(),
    hospitalId: v.id("hospitals"),
    radiographerId: v.optional(v.id("users")),
    radiologistId: v.optional(v.id("users")),
    doctorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const appointmentId = await ctx.db.insert("appointments", {
      ...args,
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    });

    // Auto-create a job for this appointment
    await ctx.db.insert("jobs", {
      appointmentId,
      hospitalId: args.hospitalId,
      status: "Scheduled",
      priority: "Normal",
      radiographerId: args.radiographerId,
      radiologistId: args.radiologistId,
      createdAt: new Date().toISOString(),
    });

    return appointmentId;
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("Scheduled"),
      v.literal("DICOM Uploaded"),
      v.literal("Under Review"),
      v.literal("Completed"),
      v.literal("Cancelled")
    ),
  },
  handler: async (ctx, { appointmentId, status }) => {
    await ctx.db.patch(appointmentId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },
});
