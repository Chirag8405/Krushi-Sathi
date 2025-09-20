import "dotenv/config";
import express from "express";
import cors from "cors";
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
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.AI_API_KEY),
      dbConfigured: Boolean(process.env.DATABASE_URL || process.env.NODE_ENV !== "production"),
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Advisory generation (AI placeholder)
  app.post("/api/advisory", postAdvisory);

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
