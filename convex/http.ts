import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const http = httpRouter();

const QMS_ROLES = new Set(["qms-manager", "qms-director", "qms-auditor", "qms-staff", "super-admin"]);
const HMAC_SECRET = process.env.QMS_HMAC_SECRET ?? "pixelence-qms-esign-secret";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// ── CORS preflight ────────────────────────────────────────────────────────────
http.route({
  path: "/api/qms/auth/login",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: CORS })),
});

// ── POST /api/qms/auth/login ──────────────────────────────────────────────────
http.route({
  path: "/api/qms/auth/login",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let email: string, password: string;
    try {
      ({ email, password } = await req.json());
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!email || !password) return json({ error: "Email and password are required" }, 400);

    const user = await ctx.runQuery(api.users.getByEmail, { email });
    if (!user) return json({ error: "Invalid credentials" }, 401);

    if (!QMS_ROLES.has(user.role))
      return json({ error: "Access denied — this portal is restricted to QMS personnel." }, 403);

    if (user.isActive === false) return json({ error: "Account is deactivated" }, 403);

    const hash = user.passwordHash ?? (user as any).password;
    if (!hash) return json({ error: "Invalid credentials" }, 401);

    const valid = await bcrypt.compare(password, hash);
    if (!valid) return json({ error: "Invalid credentials" }, 401);

    const timestamp = Date.now();
    const token = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(`${user._id}:${timestamp}`)
      .digest("hex");

    return json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive !== false,
      },
    });
  }),
});

// ── CORS preflight for esign/verify ──────────────────────────────────────────
http.route({
  path: "/api/qms/esign/verify",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: CORS })),
});

// ── POST /api/qms/esign/verify ────────────────────────────────────────────────
http.route({
  path: "/api/qms/esign/verify",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let userId: string, password: string;
    try {
      ({ userId, password } = await req.json());
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!userId || !password) return json({ error: "userId and password are required" }, 400);

    const user = await ctx.runQuery(api.users.getById, { userId: userId as any });
    if (!user) return json({ error: "User not found" }, 401);

    // getById strips hash, so re-fetch by email for the hash
    const userWithHash = await ctx.runQuery(api.users.getByEmail, { email: user.email });
    const hash = userWithHash?.passwordHash ?? (userWithHash as any)?.password;
    if (!hash) return json({ error: "Invalid credentials" }, 401);

    const valid = await bcrypt.compare(password, hash);
    if (!valid) return json({ error: "Electronic signature verification failed: invalid credentials" }, 401);

    const signedAt = new Date().toISOString();
    const signatureHash = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(`${userId}:${signedAt}`)
      .digest("hex");

    return json({ signatureHash, signedAt });
  }),
});

export default http;
