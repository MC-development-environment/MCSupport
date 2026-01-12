/* eslint-disable @typescript-eslint/no-explicit-any */
export async function register() {
  // Validate environment variables
  await import("./lib/env");
}

// onRequestError hook is optional, removing Sentry integration
export async function onRequestError(err: any, request: any, context: any) {
  // Error logging logic can be added here if needed, e.g. console.error
  console.error("Instrumentation error:", err);
}
