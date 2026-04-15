import { NextResponse } from "next/server";
import { ServiceContainer } from "../../services/service-container";

export async function GET() {
  try {
    const container = ServiceContainer.getInstance();
    const dataStorage = await container.getDataStorageService();
    const classic = await dataStorage.getClassicPersonas();
    const dynamic = (await dataStorage.getDynamicPersonas()) || [];
    return NextResponse.json({ classic, dynamic });
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}
