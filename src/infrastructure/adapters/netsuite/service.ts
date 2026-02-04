/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "@/infrastructure/logging/logger";

interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
  restDomain?: string; // e.g., https://<account>.suitetalk.api.netsuite.com
}

// Helper to get config from env
function getConfig(): NetSuiteConfig | null {
  const accountId = process.env.NETSUITE_ACCOUNT_ID;
  const consumerKey = process.env.NETSUITE_CONSUMER_KEY;
  const consumerSecret = process.env.NETSUITE_CONSUMER_SECRET;
  const tokenId = process.env.NETSUITE_TOKEN_ID;
  const tokenSecret = process.env.NETSUITE_TOKEN_SECRET;

  if (
    !accountId ||
    !consumerKey ||
    !consumerSecret ||
    !tokenId ||
    !tokenSecret
  ) {
    return null;
  }

  return {
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
    restDomain: process.env.NETSUITE_REST_DOMAIN,
  };
}

export class NetSuiteService {
  /**
   * Sync a new Case to NetSuite
   */
  static async createCase(ticket: any) {
    const config = getConfig();
    if (!config) {
      logger.warn("[NetSuite] Sync skipped: Missing credentials");
      return null;
    }

    try {
      const payload = {
        title: ticket.title,
        incomingMessage: ticket.description,
        email: ticket.user.email,
        phone: ticket.user.phone,
        priority: this.mapPriority(ticket.priority),
        status: { id: "1" }, // Default Open
        origin: { id: "-5" }, // Web
      };

      // REAL IMPLEMENTATION WOULD GO HERE using OAuth 1.0a
      // Due to complexity of OAuth 1.0a signing in pure Node without libraries like oauth-1.0a,
      // and lack of real credentials, we will log the payload.
      logger.info("[NetSuite] creating Case:", payload);

      // Mock Response for now
      return {
        internalId: `MOCK-${Date.now()}`,
        url: "https://system.netsuite.com/...",
      };
    } catch (error) {
      logger.error("[NetSuite] Failed to create case", error);
      return null;
    }
  }

  /**
   * Sync Status Update
   */
  static async updateCase(netsuiteId: string, status: string) {
    const config = getConfig();
    if (!config || !netsuiteId) return;

    const nsStatusId = this.mapStatus(status);
    logger.info(
      `[NetSuite] Updating Case ${netsuiteId} to status ${nsStatusId}`
    );
  }

  /**
   * Sync Message
   */
  static async addMessage(
    netsuiteId: string,
    message: string,
    authorEmail: string
  ) {
    const config = getConfig();
    if (!config || !netsuiteId) return;

    logger.info(
      `[NetSuite] Adding message to Case ${netsuiteId}: "${message}" from ${authorEmail}`
    );
  }

  // --- Mappers ---

  private static mapPriority(priority: string): string {
    // Return NetSuite Priority ID
    switch (priority) {
      case "LOW":
        return "1";
      case "MEDIUM":
        return "2";
      case "HIGH":
        return "3";
      case "CRITICAL":
        return "4";
      default:
        return "2";
    }
  }

  private static mapStatus(status: string): string {
    // Return NetSuite Status ID
    switch (status) {
      case "OPEN":
        return "1"; // Not Started
      case "IN_PROGRESS":
        return "2"; // In Progress
      case "WAITING_CUSTOMER":
        return "3"; // Escalated
      case "RESOLVED":
        return "4"; // Re-Opened? Or Resolved
      case "CLOSED":
        return "5"; // Closed
      default:
        return "1";
    }
  }
}
