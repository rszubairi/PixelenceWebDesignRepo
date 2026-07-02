"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

const bcrypt = require("bcryptjs");

export const seedQmsAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.optional(
      v.union(
        v.literal("qms-manager"),
        v.literal("qms-director"),
        v.literal("qms-auditor"),
        v.literal("qms-staff"),
        v.literal("super-admin")
      )
    ),
  },
  handler: async (ctx, { email, password, firstName, lastName, role }) => {
    const existing = await ctx.runQuery(api.users.getByEmail, { email });
    if (existing) {
      return { status: "already_exists", userId: existing._id, role: existing.role };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = await ctx.runMutation(internal.qms.seedInternal.insertQmsUser, {
      email,
      passwordHash,
      firstName,
      lastName,
      role: role ?? "qms-manager",
    });

    return { status: "created", userId };
  },
});
