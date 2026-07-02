/**
 * Training Gate — Cross-system compliance check.
 *
 * The clinical portal (`pixelence-mri-system`) calls `checkGate` before
 * allowing critical operations (signing reports, submitting AI analysis).
 * Returns { cleared: boolean, blockers: string[] }.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

export const checkGate = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return { cleared: false, blockers: ["User not found"] };

    // Find all active training programs required for this user's role
    const programs = await ctx.db.query("qms_training_programs").collect();
    const required = programs.filter(
      (p) => p.isActive && (!p.requiredRoles || p.requiredRoles.length === 0 || p.requiredRoles.includes(user.role))
    );

    if (required.length === 0) return { cleared: true, blockers: [] };

    const blockers: string[] = [];
    for (const program of required) {
      const record = await ctx.db
        .query("qms_training_records")
        .withIndex("by_user_program", (q) => q.eq("userId", userId).eq("programId", program._id))
        .first();

      if (!record || !record.isPassed || record.status !== "completed") {
        blockers.push(program.title);
      }
    }

    return { cleared: blockers.length === 0, blockers };
  },
});
