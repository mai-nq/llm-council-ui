import { NextResponse } from "next/server";
import {
  listConversations,
  createNewConversation,
  saveConversation,
} from "@/lib/storage";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // Security: Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`conversations:get:${clientIP}`, RATE_LIMITS.standard);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const conversations = await listConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Failed to list conversations:", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Security: Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`conversations:post:${clientIP}`, RATE_LIMITS.standard);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const conversation = createNewConversation();
    await saveConversation(conversation);

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
