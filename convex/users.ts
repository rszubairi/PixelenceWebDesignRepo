import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const bcrypt = require("bcryptjs");

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    // In a real auth system we'd use ctx.auth — here we return null for unauthenticated
    return null;
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  },
});

export const listByHospital = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
      .collect();
    return users.map(({ passwordHash: _pw, ...safe }) => safe);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(({ passwordHash: _pw, ...safe }) => safe);
  },
});

// Internal mutation used by auth actions
export const createInternal = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
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
    hospitalId: v.optional(v.id("hospitals")),
    isActive: v.boolean(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const create = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("hospital-admin"),
      v.literal("it-admin"),
      v.literal("doctor"),
      v.literal("radiologist"),
      v.literal("radiographer"),
      v.literal("finance-user")
    ),
    hospitalId: v.id("hospitals"),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(api.users.getByEmail, { email: args.email });
    if (existing) {
      throw new Error("A user with this email already exists");
    }
    const passwordHash = await bcrypt.hash(args.password, 10);
    const { password: _pw, ...rest } = args;
    return await ctx.runMutation(api.users.createInternal, {
      ...rest,
      passwordHash,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, ...fields }) => {
    await ctx.db.patch(userId, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deactivate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  },
});
