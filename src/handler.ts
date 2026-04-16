import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const getDayOfWeek = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");
  const day = DAYS[date.getDay()];
  if (!day) throw new Error("Invalid date.");
  return day;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const dateStr = event.queryStringParameters?.date;
    if (!dateStr) return { statusCode: 400, body: JSON.stringify({ error: "date parameter is required." }) };

    const dayOfWeek = getDayOfWeek(dateStr);
    return { statusCode: 200, body: JSON.stringify({ date: dateStr, dayOfWeek }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: (e as Error).message }) };
  }
};
