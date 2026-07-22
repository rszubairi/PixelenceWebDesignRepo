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

const SAMPLE_PATIENTS = [
  { patientName: "Aisha Rahman", age: 34, gender: "Female", complaint: "Recurrent headaches with visual disturbance", causeOfReferral: "Suspected intracranial lesion", referringPhysician: "Dr. Farah Idris", dicomFile: "01.dcm" },
  { patientName: "Wei Chen", age: 58, gender: "Male", complaint: "Progressive memory loss", causeOfReferral: "Rule out neurodegenerative disease", referringPhysician: "Dr. Lim Bee Hoon", dicomFile: "02.dcm" },
  { patientName: "Nur Aina Zulkifli", age: 27, gender: "Female", complaint: "Post-traumatic dizziness", causeOfReferral: "Head injury follow-up", referringPhysician: "Dr. Farah Idris", dicomFile: "03.dcm" },
  { patientName: "Rajesh Kumar", age: 45, gender: "Male", complaint: "Chronic lower back pain", causeOfReferral: "Suspected disc herniation", referringPhysician: "Dr. Priya Sharma", dicomFile: "04.dcm" },
  { patientName: "Siti Fatimah Yusof", age: 62, gender: "Female", complaint: "Numbness in left arm", causeOfReferral: "Suspected stroke follow-up", referringPhysician: "Dr. Lim Bee Hoon", dicomFile: "05.dcm" },
  { patientName: "Ahmad Faiz", age: 19, gender: "Male", complaint: "Seizure episode", causeOfReferral: "New-onset epilepsy workup", referringPhysician: "Dr. Priya Sharma", dicomFile: "06.dcm" },
  { patientName: "Mei Ling Tan", age: 71, gender: "Female", complaint: "Balance issues and confusion", causeOfReferral: "Cognitive decline evaluation", referringPhysician: "Dr. Farah Idris", dicomFile: "07.dcm" },
  { patientName: "Karthik Suresh", age: 39, gender: "Male", complaint: "Persistent tinnitus", causeOfReferral: "Rule out acoustic neuroma", referringPhysician: "Dr. Priya Sharma", dicomFile: "08.dcm" },
  { patientName: "Noraini Ismail", age: 50, gender: "Female", complaint: "Blurred vision and headache", causeOfReferral: "Suspected pituitary mass", referringPhysician: "Dr. Lim Bee Hoon", dicomFile: "09.dcm" },
];

export const seedAppointments = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("appointments").collect();
    if (existing.length > 0) {
      return { message: "Appointments already exist, skipping seed.", count: 0 };
    }

    let hospital = await ctx.db
      .query("hospitals")
      .filter((q) => q.eq(q.field("name"), "SJMC"))
      .first();

    let hospitalId;
    if (hospital) {
      hospitalId = hospital._id;
    } else {
      hospitalId = await ctx.db.insert("hospitals", {
        name: "SJMC",
        address: "2, Jalan SS 12/1a, Subang Jaya, 47500 Selangor, Malaysia",
        contactEmail: "admin@sjmc.com.my",
        contactPhone: "+60-3-5639-1212",
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }

    const now = new Date();

    for (let i = 0; i < SAMPLE_PATIENTS.length; i++) {
      const patient = SAMPLE_PATIENTS[i];
      const scheduledDateTime = new Date(now.getTime() - (SAMPLE_PATIENTS.length - i) * 86400000).toISOString();

      const appointmentId = await ctx.db.insert("appointments", {
        patientName: patient.patientName,
        patientId: `PAT-${String(i + 1).padStart(3, "0")}`,
        age: patient.age,
        gender: patient.gender,
        complaint: patient.complaint,
        causeOfReferral: patient.causeOfReferral,
        referringPhysician: patient.referringPhysician,
        scheduledDateTime,
        hospitalId,
        status: "DICOM Uploaded",
        createdAt: new Date().toISOString(),
      });

      await ctx.db.insert("jobs", {
        appointmentId,
        hospitalId,
        studyType: "Brain MRI",
        dicomFiles: [`/dicom-images/${patient.dicomFile}`],
        imageCount: 1,
        status: "Scan Complete",
        priority: "Normal",
        createdAt: new Date().toISOString(),
      });
    }

    return { message: "Sample appointments seeded successfully.", count: SAMPLE_PATIENTS.length };
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
