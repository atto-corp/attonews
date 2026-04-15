import { NextResponse } from "next/server";
import { ServiceContainer } from "../../../../services/service-container";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing artifact ID" }, { status: 400 });
  }

  try {
    const artifactService =
      await ServiceContainer.getInstance().getArtifactService();
    const result = await artifactService.generate(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating artifact:", error);
    return NextResponse.json(
      { error: "Failed to generate artifact" },
      { status: 500 }
    );
  }
}
