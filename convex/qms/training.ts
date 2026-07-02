import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listPrograms = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, { isActive }) => {
    const programs = await ctx.db.query("qms_training_programs").collect();
    return isActive !== undefined
      ? programs.filter((p) => p.isActive === isActive)
      : programs;
  },
});

export const getProgramById = query({
  args: { programId: v.id("qms_training_programs") },
  handler: async (ctx, { programId }) => ctx.db.get(programId),
});

export const getCurriculumForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const programs = await ctx.db.query("qms_training_programs").collect();
    const activePrograms = programs.filter((p) => {
      if (!p.isActive) return false;
      if (p.requiredRoles && p.requiredRoles.length > 0) {
        return p.requiredRoles.includes(user.role);
      }
      return true;
    });

    const results = await Promise.all(
      activePrograms.map(async (program) => {
        const record = await ctx.db
          .query("qms_training_records")
          .withIndex("by_user_program", (q) => q.eq("userId", userId).eq("programId", program._id))
          .first();
        return { program, record: record ?? null };
      })
    );

    return results;
  },
});

export const getRecordsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db.query("qms_training_records").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
});

export const checkUserTrainingGate = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const curriculum = await ctx.db
      .query("qms_training_records")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const hasIncomplete = curriculum.some((r) => r.status !== "completed" || !r.isPassed);
    return { isCleared: !hasIncomplete, incompleteCount: curriculum.filter((r) => r.status !== "completed").length };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createProgram = mutation({
  args: {
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
    createdById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createdById, ...rest } = args;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_training_programs", { ...rest, isActive: true, createdAt: now, updatedAt: now });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_training_programs", id, null, rest);
    return id;
  },
});

export const startAssessment = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("qms_training_programs"),
  },
  handler: async (ctx, { userId, programId }) => {
    const existing = await ctx.db
      .query("qms_training_records")
      .withIndex("by_user_program", (q) => q.eq("userId", userId).eq("programId", programId))
      .first();

    if (existing) {
      if (existing.status === "completed" && existing.isPassed) return existing._id;
      await ctx.db.patch(existing._id, { status: "in-progress" });
      return existing._id;
    }

    return await ctx.db.insert("qms_training_records", {
      userId,
      programId,
      isPassed: false,
      status: "in-progress",
      createdAt: new Date().toISOString(),
    });
  },
});

export const completeAssessment = mutation({
  args: {
    recordId: v.id("qms_training_records"),
    quizScore: v.number(),
    passed: v.boolean(),
    signatureHash: v.optional(v.string()),
  },
  handler: async (ctx, { recordId, quizScore, passed, signatureHash }) => {
    const record = await ctx.db.get(recordId);
    if (!record) throw new Error("Training record not found");

    const now = new Date().toISOString();
    let signatureId: any = undefined;

    if (passed && signatureHash) {
      signatureId = await ctx.db.insert("qms_electronic_signatures", {
        userId: record.userId,
        signedAt: now,
        meaning: "Training Completion Acknowledgment",
        signatureHash,
        trainingRecordId: recordId,
      });
    }

    await ctx.db.patch(recordId, {
      quizScore,
      isPassed: passed,
      status: passed ? "completed" : "in-progress",
      completedAt: passed ? now : undefined,
      signatureId,
    });

    await writeAuditLog(ctx.db, record.userId, "COMPLETE_ASSESSMENT", "qms_training_records", recordId, record, { quizScore, passed });
  },
});
