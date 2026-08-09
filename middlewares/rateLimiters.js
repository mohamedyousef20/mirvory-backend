import rateLimit from "express-rate-limit";

// ─── Auth-Specific Rate Limiter ──────────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});



// ─── Password Reset Limiter ──────────────────────────────────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many password reset requests. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Search Rate Limiter ─────────────────────────────────────────────────────
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many search requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
