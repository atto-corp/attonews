import { NextRequest, NextResponse } from "next/server";
import { withRedis } from "../../../utils/redis";

export const GET = withRedis(
  async (
    request: NextRequest,
    dataStorage,
    { params }: { params: Promise<{ forumId: string }> }
  ): Promise<NextResponse> => {
    const { forumId } = await params;
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const threads = await dataStorage.getForumThreads(forumId, offset, limit);
    return NextResponse.json(threads);
  }
);
