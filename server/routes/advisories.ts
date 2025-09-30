import { RequestHandler } from "express";
import { z } from "zod";
import { saveAdvisory, listAdvisories } from "../db";
import type { AdvisoryResponse } from "@shared/api";
import { randomUUID } from "crypto";

const SaveSchema = z.object({
  userId: z.string().min(1),
  advisory: z.object({
    title: z.string(),
    text: z.string(),
    steps: z.array(z.string()),
    lang: z.string(),
    source: z.enum(["template", "ai"]).optional(),
  }) as unknown as z.ZodType<AdvisoryResponse>,
});

export const postSaveAdvisory: RequestHandler = async (req, res) => {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Database not configured" });
  }
  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { userId, advisory } = parsed.data;

  try {
    await saveAdvisory({
      id: randomUUID(),
      userId,
      title: advisory.title,
      body: advisory.text,
      steps: advisory.steps,
      lang: advisory.lang,
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save advisory" });
  }
};

export const getAdvisories: RequestHandler = async (req, res) => {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Database not configured" });
  }
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const rows = await listAdvisories(userId);
    res.json({
      items: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        text: r.body,
        steps: r.steps,
        lang: r.lang,
        createdAt: r.created_at,
        source: "template",
      })),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to list advisories" });
  }
};
