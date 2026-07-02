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
      v.literal("finance-user"),
      // QMS portal roles
      v.literal("qms-manager"),
      v.literal("qms-director"),
      v.literal("qms-auditor"),
      v.literal("qms-staff")
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

  // ─── QMS Tables ────────────────────────────────────────────────────────────

  qms_change_requests: defineTable({
    crNumber: v.string(),
    title: v.string(),
    description: v.string(),
    impactAssessment: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("approved"),
      v.literal("executed"),
      v.literal("rejected")
    ),
    createdById: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_crNumber", ["crNumber"]),

  qms_documents: defineTable({
    title: v.string(),
    docNumber: v.string(),
    version: v.string(),
    type: v.union(
      v.literal("sop"),
      v.literal("manual"),
      v.literal("specification"),
      v.literal("policy"),
      v.literal("protocol")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("in-review"),
      v.literal("awaiting-approval"),
      v.literal("effective"),
      v.literal("archived"),
      v.literal("obsolete")
    ),
    contentUrl: v.optional(v.string()),
    fileStorageId: v.optional(v.string()),
    createdById: v.id("users"),
    changeRequestId: v.optional(v.id("qms_change_requests")),
    reviewers: v.optional(v.array(v.id("users"))),
    approvedById: v.optional(v.id("users")),
    approvedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_docNumber", ["docNumber"]).index("by_status", ["status"]),

  qms_training_programs: defineTable({
    title: v.string(),
    description: v.string(),
    passingScore: v.number(),
    documentId: v.id("qms_documents"),
    requiredRoles: v.optional(v.array(v.string())),
    questions: v.optional(v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
    }))),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_document", ["documentId"]),

  qms_training_records: defineTable({
    userId: v.id("users"),
    programId: v.id("qms_training_programs"),
    quizScore: v.optional(v.number()),
    isPassed: v.boolean(),
    completedAt: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    signatureId: v.optional(v.id("qms_electronic_signatures")),
    createdAt: v.string(),
  })
    .index("by_user_program", ["userId", "programId"])
    .index("by_user", ["userId"]),

  qms_requirements: defineTable({
    reqNumber: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("prd"), v.literal("srs"), v.literal("software-spec")),
    source: v.string(),
    parentId: v.optional(v.id("qms_requirements")),
    verificationRef: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("approved"), v.literal("deprecated")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_reqNumber", ["reqNumber"]).index("by_parent", ["parentId"]),

  qms_requirement_traces: defineTable({
    sourceId: v.id("qms_requirements"),
    targetId: v.id("qms_requirements"),
    traceType: v.optional(v.string()),
    codeRef: v.optional(v.string()),
    testRef: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_source", ["sourceId"]).index("by_target", ["targetId"]),

  qms_risks: defineTable({
    riskNumber: v.string(),
    hazard: v.string(),
    consequence: v.string(),
    preSeverity: v.number(),
    preProbability: v.number(),
    preDetectability: v.number(),
    preRpn: v.number(),
    mitigation: v.string(),
    mitigationRef: v.optional(v.string()),
    postSeverity: v.number(),
    postProbability: v.number(),
    postDetectability: v.number(),
    postRpn: v.number(),
    status: v.union(v.literal("open"), v.literal("mitigated"), v.literal("acceptable")),
    createdById: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_riskNumber", ["riskNumber"]).index("by_status", ["status"]),

  qms_dhf_projects: defineTable({
    projectName: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("validation"),
      v.literal("transferred"),
      v.literal("completed")
    ),
    createdById: v.optional(v.id("users")),
    createdAt: v.string(),
  }),

  qms_dhf_items: defineTable({
    projectId: v.id("qms_dhf_projects"),
    itemType: v.union(
      v.literal("input"),
      v.literal("output"),
      v.literal("verification"),
      v.literal("validation")
    ),
    itemCode: v.string(),
    description: v.string(),
    status: v.union(v.literal("draft"), v.literal("verified"), v.literal("approved")),
    linkedItems: v.array(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_project", ["projectId"]).index("by_project_code", ["projectId", "itemCode"]),

  qms_capas: defineTable({
    capaNumber: v.string(),
    source: v.string(),
    description: v.string(),
    containmentAction: v.string(),
    rootCauseMethod: v.string(),
    rootCauseAnalysis: v.string(),
    effectivenessPlan: v.string(),
    verificationDate: v.string(),
    isEffective: v.optional(v.boolean()),
    status: v.union(
      v.literal("initiated"),
      v.literal("investigating"),
      v.literal("actions-active"),
      v.literal("verification"),
      v.literal("closed")
    ),
    closedById: v.optional(v.id("users")),
    closedAt: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_capaNumber", ["capaNumber"]).index("by_status", ["status"]),

  qms_capa_action_items: defineTable({
    capaId: v.id("qms_capas"),
    task: v.string(),
    assignedToId: v.id("users"),
    dueDate: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    completedAt: v.optional(v.string()),
  }).index("by_capa", ["capaId"]),

  qms_suppliers: defineTable({
    name: v.string(),
    criticality: v.union(v.literal("critical"), v.literal("major"), v.literal("minor")),
    serviceProvided: v.string(),
    certificationUrl: v.optional(v.string()),
    certificationExpiry: v.optional(v.string()),
    evaluationScore: v.number(),
    status: v.union(v.literal("approved"), v.literal("conditional"), v.literal("suspended")),
    lastAuditDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_status", ["status"]),

  qms_complaints: defineTable({
    complaintNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    description: v.string(),
    adverseEvent: v.boolean(),
    seriousInjury: v.boolean(),
    mdrReportable: v.boolean(),
    reportReferenceId: v.optional(v.string()),
    status: v.union(
      v.literal("received"),
      v.literal("investigating"),
      v.literal("capa-raised"),
      v.literal("resolved")
    ),
    resolution: v.optional(v.string()),
    resolvedAt: v.optional(v.string()),
    capaId: v.optional(v.id("qms_capas")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_complaintNumber", ["complaintNumber"]).index("by_status", ["status"]),

  qms_audits: defineTable({
    auditNumber: v.string(),
    type: v.union(v.literal("internal"), v.literal("external"), v.literal("supplier")),
    scope: v.string(),
    leadAuditor: v.string(),
    targetDate: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("in-progress"), v.literal("completed")),
    minutesUrl: v.optional(v.string()),
    createdById: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_auditNumber", ["auditNumber"]).index("by_status", ["status"]),

  qms_audit_findings: defineTable({
    auditId: v.id("qms_audits"),
    severity: v.union(v.literal("major-nc"), v.literal("minor-nc"), v.literal("ofi")),
    description: v.string(),
    capaId: v.optional(v.id("qms_capas")),
    createdAt: v.string(),
  }).index("by_audit", ["auditId"]),

  qms_electronic_signatures: defineTable({
    userId: v.id("users"),
    signedAt: v.string(),
    meaning: v.string(),
    signatureHash: v.string(),
    documentId: v.optional(v.id("qms_documents")),
    changeRequestId: v.optional(v.id("qms_change_requests")),
    capaId: v.optional(v.id("qms_capas")),
    trainingRecordId: v.optional(v.id("qms_training_records")),
    dhfItemId: v.optional(v.id("qms_dhf_items")),
  })
    .index("by_user", ["userId"])
    .index("by_document", ["documentId"]),

  qms_audit_logs: defineTable({
    userId: v.string(),
    action: v.string(),
    tableName: v.string(),
    recordId: v.string(),
    previousState: v.optional(v.string()),
    newState: v.optional(v.string()),
    ipAddress: v.string(),
    timestamp: v.string(),
  }).index("by_timestamp", ["timestamp"]).index("by_table", ["tableName"]),

}, { schemaValidation: false });
