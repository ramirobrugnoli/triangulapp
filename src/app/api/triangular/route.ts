import { NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";
import type { TriangularResult } from "@/types";

export async function GET() {
  try {
    const triangulars = await triangularService.getTriangularHistory();
    return NextResponse.json(triangulars);
  } catch (error) {
    console.error("Error fetching triangulars:", error);
    return NextResponse.json(
      { error: "Error fetching triangulars", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const result: TriangularResult = await request.json();
    console.log("API recibió triángular:", JSON.stringify(result, null, 2));

    const triangular = await triangularService.saveTriangular(result);
    return NextResponse.json(triangular);
  } catch (error) {
    console.error("Error saving triangular:", error);
    return NextResponse.json(
      { error: "Error saving triangular", message: (error as Error).message },
      { status: 500 }
    );
  }
}
