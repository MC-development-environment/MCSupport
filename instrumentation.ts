/* eslint-disable @typescript-eslint/no-explicit-any */
export async function register() {
  // Validate environment variables
  await import("./lib/env");
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(err: any, request: any, context: any) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err);
}
