import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// bcryptjs is available via the root node_modules
const bcrypt = require("bcryptjs");

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    // Fetch user by email
    const user = await ctx.runQuery(api.users.getByEmail, { email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // isActive is optional in the schema (absent on old records means they are active)
    if (user.isActive === false) {
      throw new Error("Account is deactivated. Please contact your administrator.");
    }

    // passwordHash is used by new users; legacy documents stored the bcrypt hash in 'password'
    const hash = user.passwordHash ?? (user as any).password;
    if (!hash) {
      throw new Error("Invalid email or password");
    }
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // For hospital staff, check that the hospital license is active
    if (user.hospitalId && user.role !== "super-admin") {
      const isLicenseActive = await ctx.runQuery(api.licenses.checkActive, {
        hospitalId: user.hospitalId,
      });
      if (!isLicenseActive) {
        throw new Error("Your hospital's license is inactive or expired. Please contact Pixelence support.");
      }
    }

    // Return user data (never return passwordHash)
    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      hospitalId: user.hospitalId,
      phone: user.phone,
      department: user.department,
    };
  },
});

export const initializeDefaultAdmin = action({
  args: {},
  handler: async (ctx) => {
    // Check if super-admin already exists
    const existing = await ctx.runQuery(api.users.getByEmail, {
      email: "admin@pixelenceai.com",
    });

    if (existing) {
      return { success: false, message: "Default admin already exists" };
    }

    const passwordHash = await bcrypt.hash("Click123*", 10);
    await ctx.runMutation(api.users.createInternal, {
      email: "admin@pixelenceai.com",
      passwordHash,
      firstName: "Pixelence",
      lastName: "Admin",
      role: "super-admin",
      isActive: true,
    });

    return { success: true, message: "Default super-admin created" };
  },
});

export const initializeSJMCAdmin = action({
  args: {},
  handler: async (ctx) => {
    let hospital = await ctx.runQuery(api.hospitals.getByName, { name: "SJMC" });

    if (!hospital) {
      const hospitalId = await ctx.runMutation(api.hospitals.create, {
        name: "SJMC",
        address: "2, Jalan SS 12/1a, Subang Jaya, 47500 Selangor, Malaysia",
        contactEmail: "admin@sjmc.com.my",
        contactPhone: "+60-3-5639-1212",
      });
      hospital = await ctx.runQuery(api.hospitals.getById, { hospitalId });
    }

    const email = "admin@sjmc.com.my";
    const existing = await ctx.runQuery(api.users.getByEmail, { email });
    if (existing) {
      return { success: false, message: "SJMC admin already exists", email };
    }

    const passwordHash = await bcrypt.hash("Click123*", 10);
    await ctx.runMutation(api.users.createInternal, {
      email,
      passwordHash,
      firstName: "SJMC",
      lastName: "Admin",
      role: "hospital-admin",
      hospitalId: hospital._id,
      isActive: true,
    });

    return { success: true, message: "SJMC hospital-admin created", email };
  },
});

export const initializeSampleUsers = action({
  args: {},
  handler: async (ctx) => {
    const passwordHash = await bcrypt.hash("Click123*", 10);

    const sampleUsers = [
      { email: "doctor@pixelenceai.com", firstName: "Dr. Sarah", lastName: "Johnson", role: "doctor" as const },
      { email: "radiologist@pixelenceai.com", firstName: "Dr. Michael", lastName: "Chen", role: "radiologist" as const },
      { email: "radiographer@pixelenceai.com", firstName: "Emily", lastName: "Davis", role: "radiographer" as const },
      { email: "finance@pixelenceai.com", firstName: "Robert", lastName: "Wilson", role: "finance-user" as const },
      { email: "itadmin@pixelenceai.com", firstName: "Alex", lastName: "Thompson", role: "it-admin" as const },
    ];

    const created = [];
    for (const u of sampleUsers) {
      const existing = await ctx.runQuery(api.users.getByEmail, { email: u.email });
      if (!existing) {
        await ctx.runMutation(api.users.createInternal, {
          ...u,
          passwordHash,
          isActive: true,
        });
        created.push(u.email);
      }
    }

    return { success: true, created };
  },
});
