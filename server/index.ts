import "dotenv/config";
import express from "express";
import cors from "cors";

// Simple rate limiting middleware
const createRateLimit = (windowMs: number, max: number) => {
  const requests = new Map();
  
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip);
    // Remove old requests outside the window
    const validRequests = userRequests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= max) {
      return res.status(429).json({ 
        error: "Too many requests", 
        retryAfter: Math.ceil(windowMs / 1000) 
      });
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    next();
  };
};
import { handleDemo } from "./routes/demo";
import { postAdvisory } from "./routes/advisory";
import { postSaveAdvisory, getAdvisories } from "./routes/advisories";
import { getUpdates } from "./routes/updates";

export function createServer() {
  const app = express();

  // Basic security
  app.disable("x-powered-by");
  app.use((_, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "6mb" }));
  app.use(express.urlencoded({ extended: true, limit: "6mb" }));

  // Health/config
  app.get("/api/health", (_req, res) => {
    const startTime = Date.now();
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      features: {
        aiConfigured: Boolean(process.env.AI_API_KEY),
        dbConfigured: Boolean(process.env.DATABASE_URL || process.env.NODE_ENV !== "production"),
        offlineSupport: true,
        multiLanguage: true,
        voiceInput: true,
        imageAnalysis: true,
        weatherUpdates: true,
      },
      performance: {
        responseTimeMs: Date.now() - startTime,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
      version: "1.0.0"
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Advisory generation with rate limiting (AI endpoint)
  app.post("/api/advisory", createRateLimit(60000, 10), postAdvisory); // 10 requests per minute

  // Persistence (Neon)
  app.post("/api/advisories", postSaveAdvisory);
  app.get("/api/advisories", getAdvisories);

  // Updates (weather/market/schemes)
  app.get("/api/updates", getUpdates);

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || "Internal Server Error" });
  });

  return app;
}
