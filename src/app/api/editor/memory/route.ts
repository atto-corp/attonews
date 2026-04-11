import { NextRequest, NextResponse } from "next/server";
import { withRedis } from "../../../utils/redis";

export const GET = withRedis(async (_request: NextRequest, redis) => {
  const memoryInfo = await redis.getMemoryInfo();
  return NextResponse.json(memoryInfo);
});
