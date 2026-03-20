// Simple Password Authentication for Personal Use
// No database needed - uses env var for password and signed cookies for sessions

import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "llm-council-session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionPayload {
  exp: number; // Expiry timestamp
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return secret;
}

function getAuthPassword(): string {
  const password = process.env.AUTH_PASSWORD;
  if (!password) {
    throw new Error("AUTH_PASSWORD is not configured");
  }
  return password;
}

// Timing-safe password comparison
export function verifyPassword(input: string): boolean {
  try {
    const password = getAuthPassword();

    // Use timing-safe comparison to prevent timing attacks
    const inputBuffer = Buffer.from(input);
    const passwordBuffer = Buffer.from(password);

    if (inputBuffer.length !== passwordBuffer.length) {
      // Still do a comparison to maintain constant time
      timingSafeEqual(inputBuffer, inputBuffer);
      return false;
    }

    return timingSafeEqual(inputBuffer, passwordBuffer);
  } catch {
    return false;
  }
}

// Create signed session token
export function createSession(): string {
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");

  const signature = createHmac("sha256", getAuthSecret())
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

// Validate session token
export function validateSession(token: string): boolean {
  try {
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      return false;
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", getAuthSecret())
      .update(payloadBase64)
      .digest("base64url");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return false;
    }

    // Parse and validate payload
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString();
    const payload: SessionPayload = JSON.parse(payloadStr);

    // Check expiry
    if (payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Check if auth is configured
export function isAuthConfigured(): boolean {
  return !!(process.env.AUTH_PASSWORD && process.env.AUTH_SECRET);
}
