import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const insertQmsUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("qms-manager"),
      v.literal("qms-director"),
      v.literal("qms-auditor"),
      v.literal("qms-staff"),
      v.literal("super-admin")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: true,
    });
  },
});
