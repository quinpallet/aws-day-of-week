import { getDayOfWeek, handler } from "../src/handler";
import type { APIGatewayProxyEvent } from "aws-lambda";

const mockEvent = (date?: string) =>
  ({ queryStringParameters: date ? { date } : null } as unknown as APIGatewayProxyEvent);

describe("getDayOfWeek", () => {
  it.each<[string, string]>([
    ["2024-01-01", "Monday"],
    ["2024-12-25", "Wednesday"],
    ["2025-04-13", "Sunday"],
  ])("returns correct day for %s", (date, expected) => {
    expect(getDayOfWeek(date)).toBe(expected);
  });

  it("throws on invalid date", () => {
    expect(() => getDayOfWeek("not-a-date")).toThrow("Invalid date format");
  });
});

describe("handler", () => {
  it("returns 200 with dayOfWeek", async () => {
    const res = await handler(mockEvent("2024-01-01"));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).dayOfWeek).toBe("Monday");
  });

  it("returns 400 when date is missing", async () => {
    const res = await handler(mockEvent());
    expect(res.statusCode).toBe(400);
  });
});
