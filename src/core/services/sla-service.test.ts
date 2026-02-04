import { describe, it, expect } from "vitest";
import { calculateSlaTarget } from "./sla-service";
import { SystemConfig } from "@prisma/client";

// Mock configuration
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Prisma types stale
const mockConfig: Pick<
  SystemConfig,
  "businessHoursStart" | "businessHoursEnd" | "workDays" | "timeZone"
> = {
  businessHoursStart: 9, // 9 AM
  businessHoursEnd: 18, // 6 PM
  workDays: ["1", "2", "3", "4", "5"], // Mon-Fri
  timeZone: "America/Santo_Domingo",
};

describe("calculateSlaTarget", () => {
  it("should calculate target within the same day", () => {
    // Monday 10:00 AM
    const start = new Date("2023-10-23T10:00:00");
    const hours = 4;
    // Expected: Monday 14:00 PM
    const expected = new Date("2023-10-23T14:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });

  it("should carry over to the next business day (Overnight)", () => {
    // Monday 16:00 PM (4 PM). Business ends at 18:00 (6 PM).
    // 2 hours processed today. 2 hours remaining for tomorrow.
    const start = new Date("2023-10-23T16:00:00");
    const hours = 4;
    // Expected: Tuesday 11:00 AM (9 AM + 2 hours)
    const expected = new Date("2023-10-24T11:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });

  it("should skip weekends (Friday to Monday)", () => {
    // Friday 16:00 PM (4 PM). 2 hours left today.
    const start = new Date("2023-10-27T16:00:00"); // Oct 27 is Friday
    const hours = 4;
    // Sat 28, Sun 29 are skipped.
    // Expected: Monday 11:00 AM (9 AM + 2 hours)
    const expected = new Date("2023-10-30T11:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });

  it("should handle start time after business hours", () => {
    // Monday 20:00 PM (8 PM).
    const start = new Date("2023-10-23T20:00:00");
    const hours = 4;
    // Should start counting from Tuesday 9:00 AM
    // Expected: Tuesday 13:00 PM (9 AM + 4 hours)
    const expected = new Date("2023-10-24T13:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });

  it("should handle start time on a weekend", () => {
    // Saturday 12:00 PM.
    const start = new Date("2023-10-28T12:00:00"); // Oct 28 is Saturday
    const hours = 2;
    // Should start counting from Monday 9:00 AM
    // Expected: Monday 11:00 AM
    const expected = new Date("2023-10-30T11:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });

  it("should handle multi-day duration", () => {
    // Monday 10:00 AM.
    // SLA 20 hours.
    // Day 1 (Mon): 10am-6pm = 8 hours used. Rem: 12.
    // Day 2 (Tue): 9am-6pm = 9 hours used. Rem: 3.
    // Day 3 (Wed): 9am + 3h = 12pm.
    const start = new Date("2023-10-23T10:00:00");
    const hours = 20;
    const expected = new Date("2023-10-25T12:00:00");

    const result = calculateSlaTarget(start, hours, mockConfig);
    expect(result).toEqual(expected);
  });
});
