import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import mountRoutes from "./routes/index.route.js";
import User from "./models/user.model.js";

// تأكد من صحة هذا المسار (cron أم corn) بحسب مجلدات المشروع لديك
import { releaseDueBalancesCron } from "./cron/wallet.cron.js"; 

const app = express();

// ─── Trust proxy (for correct IP behind load balancers / Railway / Render) ──
app.set("trust proxy", 1);

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ─── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "https://mirvory-frontend-production.vercel.app")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بالطلبات التي لا تحتوي على origin (مثل أداة curl أو تطبيقات الهاتف) أو النطاقات المصرح لها
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // إرجاع false يمنع النطاق دون رمي Exception يكسر هيدرز الـ Preflight
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With", 
      "Accept", 
      "X-XSRF-TOKEN"
    ],
  })
);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});
app.use(globalLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = createServer(app);

// ─── Socket.IO (Feature Flag) ────────────────────────────────────────────────
const ENABLE_SOCKET = process.env.ENABLE_SOCKET === "true";

if (ENABLE_SOCKET) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  app.set("io", io);

  const parseCookie = (cookieHeader = "") => {
    return Object.fromEntries(
      cookieHeader
        .split(";")
        .map((part) => {
          const [key, ...val] = part.trim().split("=");
          return [key, decodeURIComponent(val.join("="))];
        })
        .filter(([key]) => key)
    );
  };

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookie(socket.request.headers.cookie || "");
      const token = cookies.accessToken;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id)
        .select("_id role firstName lastName")
        .lean();
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(String(socket.user._id));
    socket.join(socket.user.role);

    socket.on("disconnect", () => {});
  });
} else {
  app.set("io", null);
}

// ─── Routes ──────────────────────────────────────────────────────────────────
mountRoutes(app);

// ─── CRON Jobs ───────────────────────────────────────────────────────────────
cron.schedule(
  "0 0 * * *",
  () => {
    releaseDueBalancesCron();
  },
  { scheduled: true, timezone: "Africa/Cairo" }
);

// ─── 404 Handler (Must be before Global Error Handler) ────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "المسار غير موجود" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV !== "production";

  if (statusCode >= 500 || isDev) {
    console.error("ERROR:", err.message, { path: req.path, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "حدث خطأ غير متوقع",
    status: statusCode,
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Server Startup ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  console.log(`🔌 Socket.IO: ${ENABLE_SOCKET ? "ENABLED" : "DISABLED (Feature Flag)"}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close((err) => {
    if (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
