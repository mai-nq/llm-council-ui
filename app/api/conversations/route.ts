import { NextResponse } from "next/server";
import {
  listConversations,
  createNewConversation,
  saveConversation,
} from "@/lib/storage";

export async function GET() {
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

export async function POST() {
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
