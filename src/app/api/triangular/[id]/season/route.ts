import { NextResponse } from "next/server";
import { seasonService } from "@/lib/services/season";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { seasonId } = await request.json();
    const triangularId = params.id;

    if (!seasonId || typeof seasonId !== 'string') {
      return NextResponse.json(
        { error: "Season ID is required" },
        { status: 400 }
      );
    }

    await seasonService.moveTriangularToSeason(triangularId, seasonId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Triangular moved successfully" 
    });
  } catch (error) {
    console.error("Error moving triangular to season:", error);
    return NextResponse.json(
      { error: "Error moving triangular to season", message: (error as Error).message },
      { status: 500 }
    );
  }
}