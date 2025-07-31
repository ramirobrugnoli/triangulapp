import { NextResponse } from "next/server";
import { seasonService } from "@/lib/services/season";

export async function GET() {
  try {
    const activeSeason = await seasonService.getActiveSeason();
    return NextResponse.json(activeSeason);
  } catch (error) {
    console.error("Error fetching active season:", error);
    return NextResponse.json(
      { error: "Error fetching active season", message: (error as Error).message },
      { status: 500 }
    );
  }
}