const REDPILL_BASE = "https://api.redpill.ai/v1";
const TEXT_MODEL = "qwen/qwen-2.5-7b-instruct";
const VISION_MODEL = "qwen/qwen3-vl-30b-a3b-instruct";

export interface FoodAnalysis {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const SYSTEM_PROMPT = `You are a strict nutrition coach helping a client track calories for a cut. Always estimate on the HIGHER end for calories and fats — it's better to overestimate than underestimate. Assume generous portion sizes, cooking oils, and hidden calories unless explicitly stated otherwise. If no portion size is given, assume a typical restaurant-sized serving (not a small home portion).

Respond with ONLY valid JSON in this exact format, no markdown, no explanation:
{"description": "cleaned up food description", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}`;

async function callRedpill(model: string, messages: any[]): Promise<string> {
  const apiKey = process.env.REDPILL_API_KEY;
  if (!apiKey) throw new Error("REDPILL_API_KEY not configured");

  const res = await fetch(`${REDPILL_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 256,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("RedPill API error:", res.status, err);
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function parseResponse(text: string, fallbackDesc: string): FoodAnalysis {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  const parsed = JSON.parse(jsonMatch[0]) as FoodAnalysis;

  if (typeof parsed.calories !== "number" || typeof parsed.protein_g !== "number") {
    throw new Error("Invalid response structure");
  }

  return {
    description: parsed.description || fallbackDesc,
    calories: Math.round(parsed.calories),
    protein_g: Math.round(parsed.protein_g * 10) / 10,
    carbs_g: Math.round(parsed.carbs_g * 10) / 10,
    fat_g: Math.round(parsed.fat_g * 10) / 10,
  };
}

export async function analyzeFood(input: string): Promise<FoodAnalysis> {
  const text = await callRedpill(TEXT_MODEL, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Food: "${input}"` },
  ]);
  return parseResponse(text, input);
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  const text = await callRedpill(VISION_MODEL, [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "What food is in this image? Estimate the calories and macros." },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64Image}` },
        },
      ],
    },
  ]);
  return parseResponse(text, "Food from image");
}
