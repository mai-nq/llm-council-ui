import { NextResponse } from "next/server";
import { loadSettings } from "@/lib/storage";
import { runFullCouncil } from "@/lib/council";
import { getActiveModels, type Stage1Response, type Stage2Result } from "@/lib/types";

// Increase timeout for long-running council deliberations
export const maxDuration = 300; // 5 minutes

// Standalone council endpoint (without conversation persistence)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Load settings
    const settings = await loadSettings();

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: unknown) => {
          const event = JSON.stringify({ type, data });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        };

        try {
          // Get active models
          const activeModels = getActiveModels(settings);

          // Run council deliberation
          const councilResponse = await runFullCouncil(
            query,
            activeModels,
            settings.chairmanModel,
            (stage1: Stage1Response[]) => {
              sendEvent("stage1_complete", stage1);
            },
            (stage2: Stage2Result) => {
              sendEvent("stage2_complete", stage2);
            }
          );

          // Send stage 3
          sendEvent("stage3_complete", councilResponse.stage3);

          // Send complete event
          sendEvent("complete", councilResponse);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          sendEvent("error", { message: errorMessage });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Council error:", error);
    return NextResponse.json(
      { error: "Failed to run council" },
      { status: 500 }
    );
  }
}
