import { NextRequest, NextResponse } from "next/server";
import { ServiceContainer } from "../../services/service-container";
import { Artifact } from "../../schemas/types";

export async function GET() {
  try {
    const container = ServiceContainer.getInstance();
    const dataStorage = await container.getDataStorageService();
    const artifacts = await dataStorage.getAllArtifacts();
    return NextResponse.json(artifacts);
  } catch (error) {
    console.error("Error listing artifacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const container = ServiceContainer.getInstance();
    const dataStorage = await container.getDataStorageService();

    const body: Omit<Artifact, "id" | "metadata"> & {
      metadata?: Partial<Artifact["metadata"]>;
    } = await request.json();
    const artifact: Artifact = {
      id: await dataStorage.generateId("artifact"),
      type: body.type,
      inputs: body.inputs,
      prompt_system: body.prompt_system,
      prompt_user_template: body.prompt_user_template,
      output: body.output,
      metadata: {
        status: "pending" as const,
        ...body.metadata
      }
    };

    await dataStorage.saveArtifact(artifact);
    return NextResponse.json(artifact, { status: 201 });
  } catch (error) {
    console.error("Error creating artifact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
