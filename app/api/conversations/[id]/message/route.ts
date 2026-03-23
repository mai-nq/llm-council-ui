import { NextResponse } from "next/server";
import {
  loadConversation,
  saveConversation,
  loadSettings,
  generateTitle,
} from "@/lib/storage";
import { runFullCouncil, generateConversationTitle } from "@/lib/council";
import { getActiveModels, type Message, type ChatMessage, type Stage1Response, type Stage2Result } from "@/lib/types";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

// Build conversation history from previous messages
// Only includes user inputs and chairman's final responses (stage3)
// Does NOT include intermediate steps (stage1, stage2) to save tokens
function buildConversationHistory(messages: Message[]): ChatMessage[] {
  const history: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      history.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      // Only use the final synthesized response (stage3), not intermediate steps
      history.push({ role: "assistant", content: msg.content });
    }
  }

  return history;
}

// Increase timeout for long-running council deliberations
export const maxDuration = 300; // 5 minutes

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  console.log("[message/route] POST request started");

  // Security: Rate limiting for expensive LLM endpoint
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`message:${clientIP}`, RATE_LIMITS.llm);

  if (!rateLimitResult.allowed) {
    console.log("[message/route] Rate limit exceeded for:", clientIP);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  const { id } = await params;
  console.log("[message/route] Conversation ID:", id);

  try {
    const body = await request.json();
    const { content } = body;
    console.log("[message/route] Message content received, length:", content?.length);

    if (!content || typeof content !== "string") {
      console.log("[message/route] Invalid content");
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Load conversation
    console.log("[message/route] Loading conversation...");
    const conversation = await loadConversation(id);
    if (!conversation) {
      console.log("[message/route] Conversation not found:", id);
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    console.log("[message/route] Conversation loaded successfully");

    // Load settings
    console.log("[message/route] Loading settings...");
    const settings = await loadSettings();
    console.log("[message/route] Settings loaded successfully");

    // Check API key
    console.log("[message/route] Checking OPENROUTER_API_KEY...");
    console.log("[message/route] OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);
    console.log("[message/route] KV_REST_API_URL exists:", !!process.env.KV_REST_API_URL);
    console.log("[message/route] KV_REST_API_TOKEN exists:", !!process.env.KV_REST_API_TOKEN);

    if (!process.env.OPENROUTER_API_KEY) {
      console.log("[message/route] OPENROUTER_API_KEY is missing!");
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

          // Build conversation history (user + chairman responses only, no intermediate steps)
          // This is passed to models so they have context from previous turns
          const previousMessages = conversation.messages.slice(0, -1); // Exclude the just-added user message
          const conversationHistory = buildConversationHistory(previousMessages);

          // Run council deliberation with history
          const councilResponse = await runFullCouncil(
            content,
            activeModels,
            settings.chairmanModel,
            (stage1: Stage1Response[]) => {
              sendEvent("stage1_complete", stage1);
            },
            (stage2: Stage2Result) => {
              sendEvent("stage2_complete", stage2);
            },
            conversationHistory
          );

          // Send stage 3
          sendEvent("stage3_complete", councilResponse.stage3);

          // Generate AI title for first message only
          const isFirstMessage = conversation.messages.length === 1; // Only user message so far
          if (isFirstMessage) {
            try {
              const aiTitle = await generateConversationTitle(
                content,
                councilResponse.stage3,
                settings
              );
              conversation.title = aiTitle;
            } catch (titleError) {
              console.error("Failed to generate AI title, keeping fallback:", titleError);
              // Keep the existing title from generateTitle()
            }
          }

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
    console.error("[message/route] Failed to process message:", error);
    console.error("[message/route] Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
