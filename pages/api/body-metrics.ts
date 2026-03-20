import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { bodyMetrics } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const type = req.query.type as string | undefined;

    if (type) {
      const metrics = db
        .select()
        .from(bodyMetrics)
        .where(eq(bodyMetrics.metricType, type))
        .orderBy(desc(bodyMetrics.date))
        .all();
      return res.json(metrics);
    }

    const all = db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).all();
    return res.json(all);
  }

  if (req.method === "POST") {
    const { metricType, value, date } = req.body;
    if (!metricType || value === undefined || !date) {
      return res.status(400).json({ error: "metricType, value, and date are required" });
    }

    const result = db
      .insert(bodyMetrics)
      .values({ metricType, value: Number(value), date })
      .returning()
      .all();

    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    db.delete(bodyMetrics).where(eq(bodyMetrics.id, id)).run();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
