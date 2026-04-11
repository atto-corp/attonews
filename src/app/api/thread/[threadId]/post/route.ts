import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../utils/auth";

export const POST = withAuth(
  async (
    request: NextRequest,
    user,
    dataStorage,
    { params }: { params: Promise<{ threadId: string }> }
  ): Promise<NextResponse> => {
    const { threadId } = await params;
    const threadIdNum = parseInt(threadId, 10);

    if (isNaN(threadIdNum)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    const thread = await dataStorage.getThread(threadIdNum);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.length > 4096) {
      return NextResponse.json(
        { error: "Content must be 4096 characters or less" },
        { status: 400 }
      );
    }

    const result = await dataStorage.createPost(threadIdNum, content, user.id);

    return NextResponse.json({
      postId: result.postId
    });
  },
  { requiredPermission: "editor" }
);
