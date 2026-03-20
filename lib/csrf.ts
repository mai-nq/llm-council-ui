// CSRF Protection utilities
// Validates that requests come from the same origin

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // For same-origin requests, browsers may not send Origin header
  // In that case, check Referer instead
  if (!origin && !referer) {
    // No origin info - could be same-origin or API client
    // In production, you might want to reject these
    return true;
  }

  // If we have a host header, validate against it
  if (host) {
    const allowedOrigins = [
      `http://${host}`,
      `https://${host}`,
      // Add localhost variants for development
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    if (origin && allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return true;
    }

    if (referer && allowedOrigins.some((allowed) => referer.startsWith(allowed))) {
      return true;
    }
  }

  // Development mode: allow localhost
  if (process.env.NODE_ENV === "development") {
    const devOrigins = ["http://localhost:", "http://127.0.0.1:"];
    if (origin && devOrigins.some((dev) => origin.startsWith(dev))) {
      return true;
    }
    if (referer && devOrigins.some((dev) => referer.startsWith(dev))) {
      return true;
    }
  }

  return false;
}

export function createCsrfError() {
  return {
    error: "Invalid request origin",
    status: 403,
  };
}
