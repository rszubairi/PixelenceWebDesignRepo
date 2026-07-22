import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hospitals", {
      ...args,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("hospitals").order("desc").collect();
  },
});

export const getById = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    return await ctx.db.get(hospitalId);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("hospitals")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
  },
});

export const update = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, { hospitalId, ...fields }) => {
    await ctx.db.patch(hospitalId, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const suspend = mutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    await ctx.db.patch(hospitalId, {
      status: "suspended",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const activate = mutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    await ctx.db.patch(hospitalId, {
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("hospitals").collect();
    const active = all.filter((h) => h.status === "active").length;
    const suspended = all.filter((h) => h.status === "suspended").length;
    return { total: all.length, active, suspended };
  },
});
