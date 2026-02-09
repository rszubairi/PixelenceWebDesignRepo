import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Patient Management Functions
 * Queries and mutations for managing patient records
 */

// Get all patients
export const getAllPatients = query({
  handler: async (ctx) => {
    return await ctx.db.query("patients").collect();
  },
});

// Get patient by ID
export const getPatientById = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patients")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .first();
  },
});

// Create new patient
export const createPatient = mutation({
  args: {
    patientId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("patients", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update patient
export const updatePatient = mutation({
  args: {
    id: v.id("patients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete patient
export const deletePatient = mutation({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
