import { NextResponse } from "next/server";
import {
  loadConversation,
  saveConversation,
  loadSettings,
  generateTitle,
} from "@/lib/storage";
import { runFullCouncil } from "@/lib/council";
import { getActiveModels, type Message, type Stage1Response, type Stage2Result } from "@/lib/types";

// Increase timeout for long-running council deliberations
export const maxDuration = 300; // 5 minutes

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Load conversation
    const conversation = await loadConversation(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
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
          // Add user message
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            timestamp: new Date().toISOString(),
          };
          conversation.messages.push(userMessage);

          // Update title if first message
          if (conversation.messages.length === 1) {
            conversation.title = generateTitle(content);
          }

          // Get active models from settings
          const activeModels = getActiveModels(settings);

          // Run council deliberation
          const councilResponse = await runFullCouncil(
            content,
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

          // Create assistant message
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: councilResponse.stage3,
            timestamp: new Date().toISOString(),
            councilResponse,
          };
          conversation.messages.push(assistantMessage);

          // Update conversation
          conversation.updatedAt = new Date().toISOString();
          await saveConversation(conversation);

          // Send complete event
          sendEvent("complete", { conversationId: id });
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
    console.error("Failed to process message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
