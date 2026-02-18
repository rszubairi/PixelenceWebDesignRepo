import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Reports Management Functions
 * Queries and mutations for managing MRI reports
 */

// Get all reports
export const getAllReports = query({
  handler: async (ctx) => {
    return await ctx.db.query("reports").order("desc").collect();
  },
});

// Get report by reportId
export const getReportById = query({
  args: { reportId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .first();
  },
});

// Get report by jobId
export const getReportByJobId = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
  },
});

// Get reports by status
export const getReportsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Insert a single report (used by seed)
export const insertReport = mutation({
  args: {
    reportId: v.string(),
    jobId: v.string(),
    patientId: v.string(),
    patientName: v.string(),
    age: v.number(),
    gender: v.string(),
    complaint: v.string(),
    referringPhysician: v.string(),
    institution: v.string(),
    scheduledDateTime: v.string(),
    radiologistId: v.string(),
    findings: v.string(),
    impression: v.string(),
    recommendations: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    approved: v.boolean(),
    dicomFile: v.string(),
    images: v.array(v.object({
      id: v.string(),
      type: v.string(),
    })),
    aiAnalysis: v.object({
      sitesOfUptake: v.string(),
      natureOfUptake: v.string(),
      conclusion: v.string(),
      diagnosisRecommendations: v.string(),
    }),
    radiologistComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("reports", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Seed sample reports
export const seedReports = mutation({
  handler: async (ctx) => {
    // Check if reports already exist
    const existing = await ctx.db.query("reports").first();
    if (existing) {
      return { message: "Reports already seeded", count: 0 };
    }

    const now = Date.now();

    const sampleReports = [
      {
        reportId: "RPT-2023-001",
        jobId: "JOB-2023-001",
        patientId: "PAT-001",
        patientName: "John Smith",
        age: 45,
        gender: "Male",
        complaint: "Persistent headaches",
        referringPhysician: "Dr. Johnson",
        institution: "General Hospital",
        scheduledDateTime: "2023-11-20T09:00:00",
        radiologistId: "U000002",
        findings: "Abnormal signal intensity noted in the left frontal lobe with surrounding edema. Additional focus of enhancement in the right temporal lobe.",
        impression: "Findings suggest presence of primary brain tumor with possible metastasis.",
        recommendations: "Recommend biopsy for histopathological confirmation. Follow-up MRI in 4-6 weeks.",
        status: "Analysis Complete",
        priority: "Normal",
        approved: false,
        dicomFile: "01.dcm",
        images: [
          { id: "img1", type: "T1" },
          { id: "img2", type: "T2" },
          { id: "img3", type: "FLAIR" },
        ],
        aiAnalysis: {
          sitesOfUptake: "Left frontal lobe, right temporal lobe",
          natureOfUptake: "Irregular enhancement with surrounding edema",
          conclusion: "Findings suggest presence of primary brain tumor with possible metastasis",
          diagnosisRecommendations: "Recommend biopsy for histopathological confirmation",
        },
        createdAt: new Date("2023-11-20T10:30:00").getTime(),
        updatedAt: now,
      },
      {
        reportId: "RPT-2023-002",
        jobId: "JOB-2023-002",
        patientId: "PAT-002",
        patientName: "Emily Johnson",
        age: 32,
        gender: "Female",
        complaint: "Dizziness and visual disturbances",
        referringPhysician: "Dr. Williams",
        institution: "City Medical Center",
        scheduledDateTime: "2023-11-21T11:00:00",
        radiologistId: "U000002",
        findings: "Small area of demyelination in the periventricular white matter. No mass effect or midline shift.",
        impression: "Findings consistent with early demyelinating disease.",
        recommendations: "Correlate with clinical findings and CSF analysis. Follow-up MRI in 3 months.",
        status: "Under Review",
        priority: "High",
        approved: false,
        dicomFile: "02.dcm",
        images: [
          { id: "img1", type: "T1" },
          { id: "img2", type: "T2" },
          { id: "img3", type: "FLAIR" },
          { id: "img4", type: "DSW" },
        ],
        aiAnalysis: {
          sitesOfUptake: "Periventricular white matter, bilateral",
          natureOfUptake: "Small foci of high signal on T2/FLAIR sequences",
          conclusion: "Findings consistent with early demyelinating disease, possibly multiple sclerosis",
          diagnosisRecommendations: "Correlate with clinical findings and CSF analysis. Consider lumbar puncture.",
        },
        createdAt: new Date("2023-11-21T14:45:00").getTime(),
        updatedAt: now,
      },
      {
        reportId: "RPT-2023-003",
        jobId: "JOB-2023-003",
        patientId: "PAT-003",
        patientName: "Michael Brown",
        age: 58,
        gender: "Male",
        complaint: "Memory loss and confusion",
        referringPhysician: "Dr. Patel",
        institution: "University Hospital",
        scheduledDateTime: "2023-11-19T14:00:00",
        radiologistId: "U000002",
        findings: "Generalized cerebral atrophy with prominent sulci and ventriculomegaly. Hippocampal volume loss bilaterally.",
        impression: "Findings consistent with neurodegenerative disease, likely Alzheimer's type.",
        recommendations: "Neuropsychological testing recommended. Consider PET scan for further evaluation.",
        status: "Approved",
        priority: "Normal",
        approved: true,
        dicomFile: "03.dcm",
        images: [
          { id: "img1", type: "T1" },
          { id: "img2", type: "T2" },
          { id: "img3", type: "FLAIR" },
        ],
        aiAnalysis: {
          sitesOfUptake: "Bilateral hippocampi, temporal lobes, diffuse cortical regions",
          natureOfUptake: "Volume loss and signal changes consistent with atrophy",
          conclusion: "Findings consistent with neurodegenerative disease, likely Alzheimer's type",
          diagnosisRecommendations: "Neuropsychological testing recommended. Consider PET scan for further evaluation.",
        },
        radiologistComments: "Findings reviewed and approved. Consistent with clinical presentation of progressive cognitive decline.",
        createdAt: new Date("2023-11-19T16:20:00").getTime(),
        updatedAt: now,
        approvedAt: new Date("2023-11-20T09:00:00").getTime(),
      },
      {
        reportId: "RPT-2023-004",
        jobId: "JOB-2023-004",
        patientId: "PAT-004",
        patientName: "Sarah Davis",
        age: 27,
        gender: "Female",
        complaint: "Seizures and tingling in extremities",
        referringPhysician: "Dr. Chen",
        institution: "Regional Medical Center",
        scheduledDateTime: "2023-11-22T08:30:00",
        radiologistId: "U000002",
        findings: "Well-defined lesion in the right parietal lobe measuring 2.3 cm. Mild surrounding edema without significant mass effect.",
        impression: "Solitary lesion likely representing low-grade glioma.",
        recommendations: "Surgical consultation recommended. Consider MR spectroscopy for further characterization.",
        status: "Analysis Complete",
        priority: "Low",
        approved: false,
        dicomFile: "04.dcm",
        images: [
          { id: "img1", type: "T1" },
          { id: "img2", type: "T2" },
          { id: "img3", type: "FLAIR" },
        ],
        aiAnalysis: {
          sitesOfUptake: "Right parietal lobe, solitary focus",
          natureOfUptake: "Well-defined, homogeneous enhancement with mild surrounding edema",
          conclusion: "Solitary lesion likely representing low-grade glioma",
          diagnosisRecommendations: "Surgical consultation recommended. Consider MR spectroscopy for further characterization.",
        },
        createdAt: new Date("2023-11-22T11:15:00").getTime(),
        updatedAt: now,
      },
      {
        reportId: "RPT-2023-005",
        jobId: "JOB-2023-005",
        patientId: "PAT-005",
        patientName: "Robert Wilson",
        age: 63,
        gender: "Male",
        complaint: "Weakness in left arm and slurred speech",
        referringPhysician: "Dr. Martinez",
        institution: "St. Mary's Hospital",
        scheduledDateTime: "2023-11-18T10:00:00",
        radiologistId: "U000002",
        findings: "Acute ischemic infarct in the right middle cerebral artery territory. No hemorrhagic transformation.",
        impression: "Acute right MCA territory ischemic stroke.",
        recommendations: "Urgent neurology and interventional radiology consultation. Consider thrombolysis if within window.",
        status: "Approved",
        priority: "High",
        approved: true,
        dicomFile: "05.dcm",
        images: [
          { id: "img1", type: "T1" },
          { id: "img2", type: "T2" },
          { id: "img3", type: "FLAIR" },
          { id: "img4", type: "DSW" },
        ],
        aiAnalysis: {
          sitesOfUptake: "Right middle cerebral artery territory",
          natureOfUptake: "Restricted diffusion with corresponding ADC drop, consistent with acute infarction",
          conclusion: "Acute right MCA territory ischemic stroke",
          diagnosisRecommendations: "Urgent neurology and interventional radiology consultation. Consider thrombolysis if within therapeutic window.",
        },
        radiologistComments: "Acute stroke confirmed. Patient transferred to stroke unit for urgent management.",
        createdAt: new Date("2023-11-18T13:40:00").getTime(),
        updatedAt: now,
        approvedAt: new Date("2023-11-18T14:00:00").getTime(),
      },
    ];

    for (const report of sampleReports) {
      await ctx.db.insert("reports", report);
    }

    return { message: "Sample reports seeded successfully", count: sampleReports.length };
  },
});
