
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Appointments Management Functions
 * Queries and mutations for managing patient appointments
 */

// Get all appointments
export const getAllAppointments = query({
  handler: async (ctx) => {
    return await ctx.db.query("appointments").order("desc").collect();
  },
});

// Get appointments by patient
export const getAppointmentsByPatient = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();
  },
});

// Get appointments by doctor
export const getAppointmentsByDoctor = query({
  args: { doctorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_doctor", (q) => q.eq("doctorId", args.doctorId))
      .collect();
  },
});

// Get appointments by status
export const getAppointmentsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Create new appointment
export const createAppointment = mutation({
  args: {
    patientId: v.string(),
    doctorId: v.string(),
    appointmentDate: v.string(),
    appointmentTime: v.string(),
    status: v.string(),
    type: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("appointments", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update appointment
export const updateAppointment = mutation({
  args: {
    id: v.id("appointments"),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete appointment
export const deleteAppointment = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
