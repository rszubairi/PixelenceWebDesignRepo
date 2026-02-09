import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Database Schema for Pixelence MRI System
 * 
 * This schema defines the data models for the MRI imaging system,
 * including patients, appointments, imaging jobs, and reports.
 */

export default defineSchema({
  // Patients table
  patients: defineTable({
    patientId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_patientId", ["patientId"]),

  // Appointments table
  appointments: defineTable({
    patientId: v.string(),
    doctorId: v.string(),
    appointmentDate: v.string(),
    appointmentTime: v.string(),
    status: v.string(), // scheduled, completed, cancelled
    type: v.string(), // MRI, consultation, follow-up
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_status", ["status"]),

  // Imaging Jobs table
  jobs: defineTable({
    jobId: v.string(),
    patientId: v.string(),
    appointmentId: v.optional(v.string()),
    studyType: v.string(), // Brain MRI, Spine MRI, etc.
    status: v.string(), // pending, processing, completed, failed
    priority: v.string(), // low, normal, high, urgent
    dicomFiles: v.optional(v.array(v.string())),
    radiographerId: v.optional(v.string()),
    radiologistId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_jobId", ["jobId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  // Reports table
  reports: defineTable({
    reportId: v.string(),
    jobId: v.string(),
    patientId: v.string(),
    radiologistId: v.string(),
    findings: v.string(),
    impression: v.string(),
    recommendations: v.optional(v.string()),
    status: v.string(), // draft, submitted, approved
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_reportId", ["reportId"])
    .index("by_job", ["jobId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  // Users table
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()), // Bcrypt hashed password
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(), // doctor, radiologist, radiographer, finance-user, it-admin
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Billing table
  billing: defineTable({
    invoiceId: v.string(),
    patientId: v.string(),
    jobId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(), // pending, paid, overdue, cancelled
    description: v.string(),
    dueDate: v.string(),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  // System Settings table
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    category: v.string(), // system, license, integration
    description: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
