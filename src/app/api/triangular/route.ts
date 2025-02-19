import { NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";
import type { TriangularResult } from "@/types";

export async function POST(request: Request) {
  try {
    const result: TriangularResult = await request.json();
    const triangular = await triangularService.saveTriangular(result);
    return NextResponse.json(triangular);
  } catch (error) {
    console.error("Error saving triangular:", error);
    return NextResponse.json(
      { error: "Error saving triangular" },
      { status: 500 }
    );
  }
}
