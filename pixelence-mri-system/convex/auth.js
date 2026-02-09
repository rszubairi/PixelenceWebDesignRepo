import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Authentication Functions
 * Secure user authentication with bcrypt password hashing
 * 
 * Note: Auth functions use actions (not mutations) because bcrypt 
 * uses setTimeout which is not allowed in mutations.
 */

// Login function
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email (using runQuery to access database from action)
    const user = await ctx.runQuery(api.auth.getUserByEmail, { email: args.email });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.passwordHash) {
      throw new Error("User account not properly configured");
    }

    // Verify password (bcrypt works in actions)
    const isValidPassword = await bcrypt.compare(args.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is inactive. Please contact administrator.");
    }

    // Return user data without password hash
    return {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
    };
  },
});

// Helper query to get user by email (used internally by actions)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Helper query to get user by userId (used internally by actions)
export const getUserByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Helper mutation to insert user (used internally by actions)
export const insertUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

// Helper mutation to update user password (used internally by actions)
export const updateUserPassword = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      updatedAt: args.updatedAt,
    });
  },
});

// Register new user (admin only)
export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.string(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.runQuery(api.auth.getUserByEmail, { email: args.email });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password with bcrypt (salt rounds: 10) - works in actions
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Generate userId
    const userId = `U${Date.now()}`;

    const now = Date.now();

    // Create user using helper mutation
    const newUserId = await ctx.runMutation(api.auth.insertUser, {
      userId,
      email: args.email,
      passwordHash,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      phone: args.phone,
      department: args.department,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId: newUserId,
      email: args.email,
    };
  },
});

// Change password
export const changePassword = action({
  args: {
    userId: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.runQuery(api.auth.getUserByUserId, { userId: args.userId });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.passwordHash) {
      throw new Error("User account not properly configured");
    }

    // Verify current password (bcrypt works in actions)
    const isValidPassword = await bcrypt.compare(
      args.currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password (bcrypt works in actions)
    const newPasswordHash = await bcrypt.hash(args.newPassword, 10);

    // Update password using helper mutation
    await ctx.runMutation(api.auth.updateUserPassword, {
      userId: user._id,
      passwordHash: newPasswordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get current user by userId
export const getCurrentUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    // Return user without password hash
    return {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };
  },
});

// Initialize default admin user (run once)
export const initializeDefaultAdmin = action({
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.runQuery(api.auth.getUserByEmail, {
      email: "admin@pixelenceai.com",
    });

    if (existingAdmin) {
      return { message: "Default admin already exists", userId: existingAdmin.userId };
    }

    // Hash default password: Click123* (bcrypt works in actions)
    const passwordHash = await bcrypt.hash("Click123*", 10);

    const userId = "U000001";
    const now = Date.now();

    // Create default admin user using helper mutation
    await ctx.runMutation(api.auth.insertUser, {
      userId,
      email: "admin@pixelenceai.com",
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      role: "it-admin",
      department: "Administration",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: "Default admin user created successfully",
      email: "admin@pixelenceai.com",
      userId,
    };
  },
});
