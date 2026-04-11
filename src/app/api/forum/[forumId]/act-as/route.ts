import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../utils/auth";
import { ServiceContainer } from "../../../../services/service-container";
import { PERSONA_DISPLAY_NAMES } from "../../../../services/ai-prompts";
import { Persona } from "../../../../schemas/types";

const validPersonas = Object.keys(PERSONA_DISPLAY_NAMES) as Persona[];

export const GET = withAuth(
  async (
    request: NextRequest,
    user,
    dataStorage,
    { params }: { params: Promise<{ forumId: string }> }
  ): Promise<NextResponse> => {
    const { forumId } = await params;
    const { searchParams } = new URL(request.url);
    const persona = searchParams.get("persona") as Persona | null;

    if (!persona || !validPersonas.includes(persona)) {
      return NextResponse.json(
        {
          error: `Invalid persona. Must be one of: ${validPersonas.join(", ")}`
        },
        { status: 400 }
      );
    }

    try {
      const container = ServiceContainer.getInstance();
      const aiService = await container.getAIService();

      const result = await aiService.generateThreadReplyOptions(
        forumId,
        persona
      );

      return NextResponse.json({
        replies: result.replies,
        threadTitles: result.threadTitles,
        persona
      });
    } catch (error) {
      console.error("Error generating thread reply options:", error);
      return NextResponse.json(
        { error: "Failed to generate reply options" },
        { status: 500 }
      );
    }
  },
  { requiredPermission: "reader" }
);

export const POST = withAuth(
  async (
    request: NextRequest,
    user,
    dataStorage,
    { params }: { params: Promise<{ forumId: string }> }
  ): Promise<NextResponse> => {
    const { forumId } = await params;

    let body: { persona?: string; replyText?: string; threadIndex?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { persona: rawPersona, replyText } = body;

    if (!rawPersona || !validPersonas.includes(rawPersona as Persona)) {
      return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
    }

    const persona = rawPersona as Persona;

    if (!replyText || typeof replyText !== "string") {
      return NextResponse.json(
        { error: "replyText is required" },
        { status: 400 }
      );
    }

    if (replyText.length > 4096) {
      return NextResponse.json(
        { error: "Reply must be 4096 characters or less" },
        { status: 400 }
      );
    }

    try {
      const threads = await dataStorage.getForumThreads(forumId, 0, 3);

      if (threads.length === 0) {
        return NextResponse.json(
          { error: "No threads in this forum to reply to" },
          { status: 400 }
        );
      }

      const threadIndex = body.threadIndex ?? 0;
      const threadId = threads[threadIndex]?.id || threads[0].id;
      const author = PERSONA_DISPLAY_NAMES[persona];

      const result = await dataStorage.createPost(threadId, replyText, author);

      return NextResponse.json({
        postId: result.postId,
        threadId,
        author
      });
    } catch (error) {
      console.error("Error creating post:", error);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }
  },
  { requiredPermission: "reader" }
);
