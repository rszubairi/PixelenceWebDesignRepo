import { action } from "./_generated/server";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";

/**
 * Initialize Sample Users
 * Creates sample users for testing and demonstration purposes
 * All users will have the default password: Click123*
 */

export const initializeSampleUsers = action({
  handler: async (ctx) => {
    const sampleUsers = [
      {
        userId: "USR-001",
        email: "john.smith@hospital.com",
        firstName: "John",
        lastName: "Smith",
        role: "it-admin",
        department: "IT",
        phone: "+1-555-0101",
      },
      {
        userId: "USR-002",
        email: "emily.johnson@hospital.com",
        firstName: "Emily",
        lastName: "Johnson",
        role: "radiologist",
        department: "Radiology",
        phone: "+1-555-0102",
      },
      {
        userId: "USR-003",
        email: "michael.brown@hospital.com",
        firstName: "Michael",
        lastName: "Brown",
        role: "finance-user",
        department: "Finance",
        phone: "+1-555-0103",
      },
      {
        userId: "USR-004",
        email: "sarah.davis@hospital.com",
        firstName: "Sarah",
        lastName: "Davis",
        role: "radiographer",
        department: "Radiology",
        phone: "+1-555-0104",
      },
      {
        userId: "USR-005",
        email: "robert.wilson@hospital.com",
        firstName: "Robert",
        lastName: "Wilson",
        role: "doctor",
        department: "Neurology",
        phone: "+1-555-0105",
      },
    ];

    const results = [];
    const defaultPassword = "Click123*";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await ctx.runQuery(api.auth.getUserByEmail, {
          email: userData.email,
        });

        if (existingUser) {
          results.push({
            email: userData.email,
            status: "skipped",
            message: "User already exists",
          });
          continue;
        }

        // Create user
        const now = Date.now();
        await ctx.runMutation(api.auth.insertUser, {
          userId: userData.userId,
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          phone: userData.phone,
          department: userData.department,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        results.push({
          email: userData.email,
          status: "created",
          message: "User created successfully",
        });
      } catch (error) {
        results.push({
          email: userData.email,
          status: "error",
          message: error.message,
        });
      }
    }

    return {
      message: "Sample users initialization complete",
      results,
      totalProcessed: results.length,
      created: results.filter((r) => r.status === "created").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
    };
  },
});