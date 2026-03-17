import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

function generateLicenseKey(hospitalId: string): string {
  const year = new Date().getFullYear();
  const shortId = hospitalId.slice(-6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PXLC-${shortId}-${year}-${random}`;
}

export const generate = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    billingType: v.union(v.literal("per-scan"), v.literal("monthly-fixed")),
    perScanRate: v.optional(v.number()),
    monthlyRate: v.optional(v.number()),
    minimumScans: v.optional(v.number()),
    startDate: v.string(),
    expiryDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Revoke any existing active license for this hospital
    const existing = await ctx.db
      .query("licenses")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();

    for (const lic of existing) {
      if (lic.status === "active") {
        await ctx.db.patch(lic._id, { status: "revoked" });
      }
    }

    const licenseKey = generateLicenseKey(args.hospitalId);

    return await ctx.db.insert("licenses", {
      ...args,
      licenseKey,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  },
});

export const getByHospital = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    return await ctx.db
      .query("licenses")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
      .order("desc")
      .first();
  },
});

export const getAllByHospital = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    return await ctx.db
      .query("licenses")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
      .order("desc")
      .collect();
  },
});

export const checkActive = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, { hospitalId }) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", hospitalId))
      .order("desc")
      .first();

    if (!license || license.status === "revoked") return false;
    // Treat status "expired" or a past expiryDate as inactive (read-only; no write in query)
    if (license.status === "expired") return false;
    const now = new Date().toISOString();
    if (license.expiryDate < now) return false;

    return true;
  },
});

// Call this mutation to stamp expired status on stale licenses (e.g. from a cron or admin action)
export const expireStale = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const active = await ctx.db
      .query("licenses")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    let count = 0;
    for (const lic of active) {
      if (lic.expiryDate < now) {
        await ctx.db.patch(lic._id, { status: "expired" });
        count++;
      }
    }
    return { expired: count };
  },
});

export const revoke = mutation({
  args: { licenseId: v.id("licenses") },
  handler: async (ctx, { licenseId }) => {
    await ctx.db.patch(licenseId, { status: "revoked" });
  },
});

export const renew = mutation({
  args: {
    licenseId: v.id("licenses"),
    expiryDate: v.string(),
    billingType: v.optional(v.union(v.literal("per-scan"), v.literal("monthly-fixed"))),
    perScanRate: v.optional(v.number()),
    monthlyRate: v.optional(v.number()),
    minimumScans: v.optional(v.number()),
  },
  handler: async (ctx, { licenseId, ...fields }) => {
    await ctx.db.patch(licenseId, {
      ...fields,
      status: "active",
    });
  },
});

export const getExpiringLicenses = query({
  args: { daysAhead: v.number() },
  handler: async (ctx, { daysAhead }) => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysAhead);
    const thresholdStr = threshold.toISOString();
    const nowStr = new Date().toISOString();

    const active = await ctx.db
      .query("licenses")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return active.filter(
      (l) => l.expiryDate > nowStr && l.expiryDate <= thresholdStr
    );
  },
});
