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

// Get appointment by appointmentId
export const getAppointmentById = query({
  args: { appointmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .first();
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
    appointmentId: v.string(),
    patientId: v.string(),
    patientName: v.string(),
    age: v.number(),
    gender: v.string(),
    complaint: v.string(),
    causeOfReferral: v.string(),
    referringPhysician: v.string(),
    institution: v.string(),
    doctorId: v.string(),
    scheduledDateTime: v.string(),
    status: v.string(),
    type: v.string(),
    priority: v.string(),
    notes: v.optional(v.string()),
    contactInfo: v.object({
      phone: v.string(),
      email: v.string(),
      emergencyContact: v.string(),
    }),
    medicalHistory: v.array(v.string()),
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
    scheduledDateTime: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
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

// Seed sample appointments
export const seedAppointments = mutation({
  handler: async (ctx) => {
    // Check if appointments already exist
    const existing = await ctx.db.query("appointments").first();
    if (existing) {
      return { message: "Appointments already seeded", count: 0 };
    }

    const now = Date.now();

    const sampleAppointments = [
      {
        appointmentId: "JOB-2023-001",
        patientId: "PAT-001",
        patientName: "John Smith",
        age: 45,
        gender: "Male",
        complaint: "Persistent headaches",
        causeOfReferral: "Neurological symptoms",
        referringPhysician: "Dr. Johnson",
        institution: "General Hospital",
        doctorId: "U000002",
        scheduledDateTime: "2023-11-20T09:00:00",
        status: "Scheduled",
        type: "MRI",
        priority: "Normal",
        notes: "Patient reports headaches for the past 2 weeks. Previous CT scan showed no abnormalities.",
        contactInfo: {
          phone: "+1 (555) 123-4567",
          email: "john.smith@email.com",
          emergencyContact: "Jane Smith - Sister - +1 (555) 987-6543",
        },
        medicalHistory: [
          "Hypertension (controlled)",
          "Previous migraine episodes",
          "Allergic to penicillin",
        ],
        createdAt: new Date("2023-11-18T08:00:00").getTime(),
        updatedAt: now,
      },
      {
        appointmentId: "JOB-2023-002",
        patientId: "PAT-002",
        patientName: "Emily Johnson",
        age: 32,
        gender: "Female",
        complaint: "Memory loss",
        causeOfReferral: "Cognitive assessment",
        referringPhysician: "Dr. Williams",
        institution: "City Medical Center",
        doctorId: "U000002",
        scheduledDateTime: "2023-11-21T14:30:00",
        status: "DICOM Uploaded",
        type: "MRI",
        priority: "High",
        notes: "Patient experiencing short-term memory loss over the past month. Family history of early-onset dementia.",
        contactInfo: {
          phone: "+1 (555) 234-5678",
          email: "emily.johnson@email.com",
          emergencyContact: "Mark Johnson - Husband - +1 (555) 876-5432",
        },
        medicalHistory: [
          "No significant past medical history",
          "Family history of dementia",
          "Non-smoker",
        ],
        createdAt: new Date("2023-11-19T10:00:00").getTime(),
        updatedAt: now,
      },
      {
        appointmentId: "JOB-2023-003",
        patientId: "PAT-003",
        patientName: "Michael Brown",
        age: 58,
        gender: "Male",
        complaint: "Seizures",
        causeOfReferral: "Epilepsy evaluation",
        referringPhysician: "Dr. Davis",
        institution: "University Hospital",
        doctorId: "U000002",
        scheduledDateTime: "2023-11-19T11:15:00",
        status: "Under Review",
        type: "MRI",
        priority: "High",
        notes: "New onset seizures in the past week. Two witnessed tonic-clonic episodes. EEG showed focal abnormalities.",
        contactInfo: {
          phone: "+1 (555) 345-6789",
          email: "michael.brown@email.com",
          emergencyContact: "Lisa Brown - Wife - +1 (555) 765-4321",
        },
        medicalHistory: [
          "Type 2 diabetes",
          "Hyperlipidemia",
          "Previous TIA (2021)",
          "On aspirin and metformin",
        ],
        createdAt: new Date("2023-11-17T09:00:00").getTime(),
        updatedAt: now,
      },
      {
        appointmentId: "JOB-2023-004",
        patientId: "PAT-004",
        patientName: "Sarah Davis",
        age: 27,
        gender: "Female",
        complaint: "Dizziness",
        causeOfReferral: "Balance issues",
        referringPhysician: "Dr. Miller",
        institution: "Regional Medical Center",
        doctorId: "U000002",
        scheduledDateTime: "2023-11-22T10:00:00",
        status: "Scheduled",
        type: "MRI",
        priority: "Low",
        notes: "Intermittent dizziness and vertigo episodes for 3 months. ENT evaluation was unremarkable.",
        contactInfo: {
          phone: "+1 (555) 456-7890",
          email: "sarah.davis@email.com",
          emergencyContact: "Tom Davis - Father - +1 (555) 654-3210",
        },
        medicalHistory: [
          "Anxiety disorder (managed)",
          "No prior surgeries",
          "No known drug allergies",
        ],
        createdAt: new Date("2023-11-20T14:00:00").getTime(),
        updatedAt: now,
      },
      {
        appointmentId: "JOB-2023-005",
        patientId: "PAT-005",
        patientName: "Robert Wilson",
        age: 63,
        gender: "Male",
        complaint: "Vision changes",
        causeOfReferral: "Optic nerve assessment",
        referringPhysician: "Dr. Taylor",
        institution: "St. Mary's Hospital",
        doctorId: "U000002",
        scheduledDateTime: "2023-11-18T15:45:00",
        status: "Completed",
        type: "MRI",
        priority: "Normal",
        notes: "Progressive visual field loss in the left eye over 2 months. Ophthalmology suspects compressive optic neuropathy.",
        contactInfo: {
          phone: "+1 (555) 567-8901",
          email: "robert.wilson@email.com",
          emergencyContact: "Mary Wilson - Wife - +1 (555) 543-2109",
        },
        medicalHistory: [
          "Coronary artery disease",
          "Previous CABG surgery (2019)",
          "Hypertension",
          "Glaucoma (left eye)",
          "On warfarin and lisinopril",
        ],
        createdAt: new Date("2023-11-16T11:00:00").getTime(),
        updatedAt: now,
      },
    ];

    for (const appointment of sampleAppointments) {
      await ctx.db.insert("appointments", appointment);
    }

    return { message: "Sample appointments seeded successfully", count: sampleAppointments.length };
  },
});
