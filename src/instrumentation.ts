/* eslint-disable @typescript-eslint/no-explicit-any */
export async function register() {
  // Validate environment variables
  await import("@/common/config/env");
}

export async function onRequestError(err: any, _request: any, _context: any) {
  // Error logging logic can be added here if needed
  console.error("Instrumentation error:", err);
}
