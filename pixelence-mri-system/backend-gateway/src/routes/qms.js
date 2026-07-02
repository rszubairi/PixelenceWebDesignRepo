/**
 * QMS Routes — FDA 21 CFR Part 11 E-Signature & Auth
 *
 * POST /api/qms/esign/verify  — Dual-factor credential check: verifies the user's
 *   password with bcryptjs and returns an HMAC-SHA256 signature hash.
 *   Called by the Convex action `qms/signatures.verifyAndApply`.
 *
 * POST /api/qms/auth/login    — QMS-specific login (same user store as clinical,
 *   but filtered to QMS roles). Returns user data + session token.
 */

const express = require('express');
const crypto = require('crypto');
const { ConvexHttpClient } = require('convex/browser');

const router = express.Router();
const bcrypt = require('bcryptjs');

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || '';
const HMAC_SECRET = process.env.QMS_HMAC_SECRET || 'pixelence-qms-esign-secret';

function getConvexClient() {
  return new ConvexHttpClient(CONVEX_URL);
}

const QMS_ROLES = new Set(['qms-manager', 'qms-director', 'qms-auditor', 'qms-staff', 'super-admin']);

// ── POST /api/qms/auth/login ──────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const client = getConvexClient();
    // Use the anyApi pattern to call the shared users.getByEmail query
    const { anyApi } = require('convex/server');
    const user = await client.query(anyApi.users.getByEmail, { email });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!QMS_ROLES.has(user.role)) return res.status(403).json({ error: 'Access denied. This portal is restricted to QMS personnel.' });
    if (user.isActive === false) return res.status(403).json({ error: 'Account is deactivated' });

    const hash = user.passwordHash ?? user.password;
    if (!hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Simple session token (HMAC of userId + timestamp)
    const timestamp = Date.now();
    const token = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${user._id}:${timestamp}`)
      .digest('hex');

    res.json({
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
  } catch (err) {
    console.error('[QMS login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── POST /api/qms/esign/verify ────────────────────────────────────────────────
// Verifies the user's password and returns an HMAC-SHA256 signature hash.
// The hash embeds userId + timestamp and is stored immutably in qms_electronic_signatures.
router.post('/esign/verify', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: 'userId and password are required' });
    }

    const client = getConvexClient();
    const { anyApi } = require('convex/server');
    const user = await client.query(anyApi.users.getById, { userId });

    if (!user) return res.status(401).json({ error: 'User not found' });

    // We need the password hash — getById strips it, so fetch raw via getByEmail
    const userWithHash = await client.query(anyApi.users.getByEmail, { email: user.email });
    const hash = userWithHash?.passwordHash ?? userWithHash?.password;
    if (!hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: 'Electronic signature verification failed: invalid credentials' });

    // Build immutable HMAC hash per 21 CFR §11.50
    const signedAt = new Date().toISOString();
    const signatureHash = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${userId}:${signedAt}`)
      .digest('hex');

    res.json({ signatureHash, signedAt });
  } catch (err) {
    console.error('[QMS esign/verify]', err);
    res.status(500).json({ error: 'Signature verification failed' });
  }
});

module.exports = router;
