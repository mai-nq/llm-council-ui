import { NextResponse } from "next/server";
import {
  verifyPassword,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  isAuthConfigured,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Check if auth is configured
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: "Authentication is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create session
    const session = createSession();

    // Create response with session cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
