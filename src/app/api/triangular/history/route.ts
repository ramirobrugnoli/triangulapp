import { NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const allSeasons = searchParams.get('allSeasons') === 'true';
    
    const triangulars = await triangularService.getTriangularHistory(
      seasonId || undefined, 
      allSeasons
    );
    return NextResponse.json(triangulars);
  } catch (error) {
    console.error("Error fetching triangular history:", error);
    return NextResponse.json(
      {
        error: "Error fetching triangular history",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
