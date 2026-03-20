import { NextResponse } from "next/server";
import { z } from "zod";
import { loadSettings, saveSettings } from "@/lib/storage";
import { COUNCIL_MODELS } from "@/lib/types";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

// Security: Zod schema for input validation
const ModelConfigSchema = z.object({
  modelId: z.string().min(1).max(100),
  active: z.boolean(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(8192),
  systemPrompt: z.string().max(2000),
});

const SettingsSchema = z.object({
  models: z.array(ModelConfigSchema).min(1).max(10),
  chairmanModel: z.string().min(1).max(100),
});

// Whitelist of valid model IDs
const VALID_MODEL_IDS = new Set(COUNCIL_MODELS.map((m) => m.id));

export async function GET(request: Request) {
  // Security: Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`settings:get:${clientIP}`, RATE_LIMITS.settings);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const settings = await loadSettings();
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;

    return NextResponse.json({
      ...settings,
      hasApiKey,
    });
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Security: Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`settings:post:${clientIP}`, RATE_LIMITS.settings);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Security: Validate input with Zod schema
    const parseResult = SettingsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid settings format", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const settings = parseResult.data;

    // Security: Validate model IDs against whitelist
    for (const model of settings.models) {
      if (!VALID_MODEL_IDS.has(model.modelId)) {
        return NextResponse.json(
          { error: `Invalid model ID: ${model.modelId}` },
          { status: 400 }
        );
      }
    }

    if (!VALID_MODEL_IDS.has(settings.chairmanModel)) {
      return NextResponse.json(
        { error: `Invalid chairman model: ${settings.chairmanModel}` },
        { status: 400 }
      );
    }

    await saveSettings(settings);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
