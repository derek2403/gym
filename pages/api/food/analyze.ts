import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeFood, analyzeFoodImage } from "@/lib/gemini";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  if (!process.env.REDPILL_API_KEY) {
    return res.status(500).json({ error: "REDPILL_API_KEY not configured. Get one at redpill.ai" });
  }

  const { input, image } = req.body;

  if (!input?.trim() && !image) {
    return res.status(400).json({ error: "Food description or image is required" });
  }

  try {
    const result = image
      ? await analyzeFoodImage(image)
      : await analyzeFood(input);
    return res.json(result);
  } catch (err: any) {
    console.error("Food analysis failed:", err);
    return res.status(500).json({ error: "Failed to analyze food. Try again." });
  }
}
