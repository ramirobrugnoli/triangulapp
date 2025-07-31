import { NextResponse } from "next/server";
import { seasonService } from "@/lib/services/season";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la temporada es requerido" },
        { status: 400 }
      );
    }

    const updatedSeason = await seasonService.updateSeasonName(id, name.trim());

    return NextResponse.json(updatedSeason);
  } catch (error) {
    console.error("Error updating season name:", error);
    return NextResponse.json(
      { error: "Error al actualizar el nombre de la temporada" },
      { status: 500 }
    );
  }
}