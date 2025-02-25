import { NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";

export async function GET() {
  try {
    const triangulars = await triangularService.getTriangularHistory();
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
