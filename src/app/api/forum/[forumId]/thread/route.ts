import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../utils/auth";

export const POST = withAuth(
  async (
    request: NextRequest,
    user,
    dataStorage,
    { params }: { params: Promise<{ forumId: string }> }
  ): Promise<NextResponse> => {
    const { forumId } = await params;

    let body: { title?: string; content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (content.length > 4096) {
      return NextResponse.json(
        { error: "Content must be 4096 characters or less" },
        { status: 400 }
      );
    }

    const result = await dataStorage.createThread(
      forumId,
      title,
      user.id,
      content
    );

    return NextResponse.json({
      threadId: result.threadId,
      postId: result.postId
    });
  },
  { requiredPermission: "editor" }
);
