import { NextResponse } from "next/server";
import { z } from "zod";
import { loadSettings, saveSettings } from "@/lib/storage";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

// Model ID format: "provider/model-name" (e.g., "openai/gpt-4", "anthropic/claude-3")
const ModelIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9_-]+\/[a-z0-9_.-]+$/i,
    "Model ID must be in format: provider/model-name"
  );

// Security: Zod schema for input validation
const ModelConfigSchema = z.object({
  modelId: ModelIdSchema,
  active: z.boolean(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).max(8192),
  systemPrompt: z.string().max(2000),
});

const SettingsSchema = z.object({
  models: z.array(ModelConfigSchema).min(1).max(10),
  chairmanModel: ModelIdSchema,
});

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

    // Validate chairman is one of the configured models
    const modelIds = settings.models.map((m) => m.modelId);
    if (!modelIds.includes(settings.chairmanModel)) {
      return NextResponse.json(
        { error: "Chairman must be one of the configured models" },
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
