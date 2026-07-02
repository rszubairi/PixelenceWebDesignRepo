import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { writeAuditLog } from "./auditTrail";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listProjects = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    let projects = await ctx.db.query("qms_dhf_projects").collect();
    if (status) projects = projects.filter((p) => p.status === status);
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const getProjectById = query({
  args: { projectId: v.id("qms_dhf_projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const items = await ctx.db
      .query("qms_dhf_items")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Group items by phase
    const grouped = {
      input: items.filter((i) => i.itemType === "input"),
      output: items.filter((i) => i.itemType === "output"),
      verification: items.filter((i) => i.itemType === "verification"),
      validation: items.filter((i) => i.itemType === "validation"),
    };

    return { ...project, items, grouped };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createProject = mutation({
  args: {
    projectName: v.string(),
    description: v.optional(v.string()),
    createdById: v.id("users"),
  },
  handler: async (ctx, { projectName, description, createdById }) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_dhf_projects", {
      projectName,
      description,
      status: "planning",
      createdById,
      createdAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_dhf_projects", id, null, { projectName });
    return id;
  },
});

export const advanceProjectStatus = mutation({
  args: {
    projectId: v.id("qms_dhf_projects"),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("validation"),
      v.literal("transferred"),
      v.literal("completed")
    ),
    updatedById: v.id("users"),
  },
  handler: async (ctx, { projectId, status, updatedById }) => {
    const prev = await ctx.db.get(projectId);
    await ctx.db.patch(projectId, { status });
    await writeAuditLog(ctx.db, updatedById, "STATUS_CHANGE", "qms_dhf_projects", projectId, prev, { status });
  },
});

export const addItem = mutation({
  args: {
    projectId: v.id("qms_dhf_projects"),
    itemType: v.union(v.literal("input"), v.literal("output"), v.literal("verification"), v.literal("validation")),
    itemCode: v.string(),
    description: v.string(),
    linkedItems: v.optional(v.array(v.string())),
    createdById: v.id("users"),
  },
  handler: async (ctx, { createdById, linkedItems, ...rest }) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("qms_dhf_items", {
      ...rest,
      linkedItems: linkedItems ?? [],
      status: "draft",
      createdAt: now,
    });
    await writeAuditLog(ctx.db, createdById, "CREATE", "qms_dhf_items", id, null, rest);
    return id;
  },
});

export const approveItem = mutation({
  args: {
    itemId: v.id("qms_dhf_items"),
    signatureHash: v.string(),
    approvedById: v.id("users"),
  },
  handler: async (ctx, { itemId, signatureHash, approvedById }) => {
    const prev = await ctx.db.get(itemId);
    if (!prev) throw new Error("DHF item not found");
    const now = new Date().toISOString();

    await ctx.db.patch(itemId, { status: "approved", approvedBy: approvedById, approvedAt: now });

    await ctx.db.insert("qms_electronic_signatures", {
      userId: approvedById,
      signedAt: now,
      meaning: "DHF Item Approval",
      signatureHash,
      dhfItemId: itemId,
    });

    await writeAuditLog(ctx.db, approvedById, "APPROVE", "qms_dhf_items", itemId, prev, { status: "approved" });
  },
});
