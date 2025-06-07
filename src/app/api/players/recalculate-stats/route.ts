import { NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";

export async function POST() {
  try {
    const result = await triangularService.recalculateAllPlayerStats();
    
    return NextResponse.json({
      success: true,
      message: `Estadísticas recalculadas exitosamente para ${result.triangularsProcessed} triangulares`,
      triangularsProcessed: result.triangularsProcessed
    });
  } catch (error) {
    console.error("Error recalculando estadísticas:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: "Error recalculando estadísticas de jugadores",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
} 