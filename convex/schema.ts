import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Helper: timestamps stored as ISO strings in new data, but old data may have used numbers.
const ts = v.union(v.string(), v.number());
const tsOpt = v.optional(v.union(v.string(), v.number()));

// schemaValidation: false — disables per-document runtime validation so legacy documents
// with extra/differently-typed fields are accepted. All indexes still function normally
// and TypeScript types are still generated from the table definitions below.
export default defineSchema({
  hospitals: defineTable({
    name: v.string(),
    address: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    createdAt: ts,
    updatedAt: tsOpt,
  }).index("by_status", ["status"]),

  licenses: defineTable({
    hospitalId: v.id("hospitals"),
    licenseKey: v.string(),
    billingType: v.union(v.literal("per-scan"), v.literal("monthly-fixed")),
    perScanRate: v.optional(v.number()),
    monthlyRate: v.optional(v.number()),
    minimumScans: v.optional(v.number()),
    startDate: v.string(),
    expiryDate: v.string(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("revoked")),
    createdAt: ts,
  })
    .index("by_hospital", ["hospitalId"])
    .index("by_key", ["licenseKey"]),

  users: defineTable({
    email: v.string(),
    // passwordHash for new users; old documents used 'password' field (extra fields are allowed).
    passwordHash: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("super-admin"),
      v.literal("hospital-admin"),
      v.literal("it-admin"),
      v.literal("doctor"),
      v.literal("radiologist"),
      v.literal("radiographer"),
      v.literal("finance-user")
    ),
    // Old records stored hospitalId as plain strings (e.g. "H000001"); new records use Convex IDs
    hospitalId: v.optional(v.union(v.id("hospitals"), v.string())),
    // isActive may be absent in old records
    isActive: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    createdAt: ts,
    updatedAt: tsOpt,
  })
    .index("by_email", ["email"])
    .index("by_hospital", ["hospitalId"])
    .index("by_role", ["role"]),

  appointments: defineTable({
    patientName: v.string(),
    patientId: v.optional(v.string()),
    // Old records may store age/gender as different types or names
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    complaint: v.optional(v.string()),
    // Old records stored medicalHistory as an array of strings; new records use a single string
    medicalHistory: v.optional(v.union(v.string(), v.array(v.string()))),
    causeOfReferral: v.optional(v.string()),
    referringPhysician: v.optional(v.string()),
    // scheduledDateTime may be ISO string or numeric timestamp
    scheduledDateTime: v.optional(v.union(v.string(), v.number())),
    // Use v.string() to allow legacy status values ("Pending", "Analysis Complete", etc.)
    status: v.string(),
    // hospitalId was not present in old records
    hospitalId: v.optional(v.id("hospitals")),
    // Old records stored user IDs as plain strings (e.g. "U000002"); new records use Convex IDs
    radiographerId: v.optional(v.union(v.id("users"), v.string())),
    radiologistId: v.optional(v.union(v.id("users"), v.string())),
    doctorId: v.optional(v.union(v.id("users"), v.string())),
    createdAt: ts,
    updatedAt: tsOpt,
  })
    .index("by_hospital", ["hospitalId"])
    .index("by_status", ["status"])
    .index("by_radiographer", ["radiographerId"])
    .index("by_doctor", ["doctorId"]),

  jobs: defineTable({
    // appointmentId and hospitalId were not in old records
    appointmentId: v.optional(v.union(v.id("appointments"), v.string())),
    hospitalId: v.optional(v.id("hospitals")),
    studyType: v.optional(v.string()),
    dicomFiles: v.optional(v.array(v.string())),
    imageCount: v.optional(v.number()),
    // Use v.string() to allow legacy statuses: "Scan Complete", "Enhanced", "Processing", etc.
    status: v.string(),
    priority: v.optional(v.string()),
    enhancedMriPath: v.optional(v.string()),
    enhancedMriGeneratedAt: tsOpt,
    // Old records stored user IDs as plain strings; new records use Convex IDs
    radiographerId: v.optional(v.union(v.id("users"), v.string())),
    radiologistId: v.optional(v.union(v.id("users"), v.string())),
    createdAt: ts,
    updatedAt: tsOpt,
  })
    .index("by_hospital", ["hospitalId"])
    .index("by_appointment", ["appointmentId"])
    .index("by_status", ["status"])
    .index("by_radiologist", ["radiologistId"]),

  reports: defineTable({
    // These IDs were not in old records; old records may also have stored plain string IDs
    jobId: v.optional(v.union(v.id("jobs"), v.string())),
    appointmentId: v.optional(v.union(v.id("appointments"), v.string())),
    hospitalId: v.optional(v.id("hospitals")),
    aiAnalysis: v.optional(v.object({
      sitesOfUptake: v.string(),
      natureOfUptake: v.string(),
      conclusion: v.string(),
      diagnosisRecommendations: v.string(),
    })),
    radiologistComments: v.optional(v.string()),
    // radiologistApproved absent in old records
    radiologistApproved: v.optional(v.boolean()),
    // Old records stored user IDs as plain strings; new records use Convex IDs
    radiologistId: v.optional(v.union(v.id("users"), v.string())),
    radiologistSubmittedAt: tsOpt,
    doctorComments: v.optional(v.string()),
    doctorId: v.optional(v.union(v.id("users"), v.string())),
    doctorCommentedAt: tsOpt,
    // Use v.string() to allow any legacy status value
    status: v.string(),
    createdAt: ts,
    updatedAt: tsOpt,
  })
    .index("by_hospital", ["hospitalId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"])
    .index("by_doctor", ["doctorId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("scan_ready"),
      v.literal("report_submitted"),
      v.literal("report_approved"),
      v.literal("new_case"),
      v.literal("license_expiring")
    ),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.union(v.literal("job"), v.literal("report"), v.literal("appointment"))),
    isRead: v.boolean(),
    createdAt: ts,
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
}, { schemaValidation: false });
