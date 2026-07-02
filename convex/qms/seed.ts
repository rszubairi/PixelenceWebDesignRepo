"use node";
import { action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

const bcrypt = require("bcryptjs");

// Internal mutation — direct insert that supports QMS roles
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

// Public action — hashes password then calls insertQmsUser
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

    const userId = await ctx.runMutation(internal.qms.seed.insertQmsUser, {
      email,
      passwordHash,
      firstName,
      lastName,
      role: role ?? "qms-manager",
    });

    return { status: "created", userId };
  },
});
