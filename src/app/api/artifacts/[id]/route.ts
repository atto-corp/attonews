import { NextResponse } from "next/server";
import { ServiceContainer } from "../../../services/service-container";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing artifact ID" }, { status: 400 });
  }

  try {
    const dataStorage =
      await ServiceContainer.getInstance().getDataStorageService();
    const artifact = await dataStorage.getArtifact(id);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(artifact);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifact" },
      { status: 500 }
    );
  }
}
