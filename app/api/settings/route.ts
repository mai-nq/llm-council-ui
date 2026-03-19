import { NextResponse } from "next/server";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/types";

export async function GET() {
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
  try {
    const body = await request.json();
    const settings: Settings = {
      models: body.models,
      chairmanModel: body.chairmanModel,
    };

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
