import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// PostgreSQL for production
export const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : null;

// In-memory storage for development when no database is configured
let inMemoryStorage: Array<{
  id: string; user_id: string; title: string; body: string; steps: string[]; lang: string; created_at: string;
}> = [];

export async function ensureSchema() {
  if (pool) {
    // PostgreSQL schema
    await pool.query(
      `CREATE TABLE IF NOT EXISTS advisories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        steps JSONB NOT NULL,
        lang TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );
  }
  // No setup needed for in-memory storage
}

export async function saveAdvisory(rec: {
  id: string;
  userId: string;
  title: string;
  body: string;
  steps: string[];
  lang: string;
}) {
  await ensureSchema();
  
  if (pool) {
    // PostgreSQL
    await pool.query(
      `INSERT INTO advisories (id, user_id, title, body, steps, lang)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [rec.id, rec.userId, rec.title, rec.body, JSON.stringify(rec.steps), rec.lang]
    );
  } else {
    // In-memory storage for development
    inMemoryStorage.push({
      id: rec.id,
      user_id: rec.userId,
      title: rec.title,
      body: rec.body,
      steps: rec.steps,
      lang: rec.lang,
      created_at: new Date().toISOString()
    });
  }
}

export async function listAdvisories(userId: string) {
  await ensureSchema();
  
  if (pool) {
    // PostgreSQL
    const r = await pool.query(
      `SELECT id, user_id, title, body, steps, lang, created_at FROM advisories
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return r.rows.map(row => ({
      ...row,
      steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps
    }));
  } else {
    // In-memory storage for development
    return inMemoryStorage
      .filter(item => item.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
