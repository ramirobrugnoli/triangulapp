import { NextRequest, NextResponse } from "next/server";
import { triangularService } from "@/lib/services/triangular";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const triangular = await triangularService.getTriangularById(id);
    
    if (!triangular) {
      return NextResponse.json(
        { error: "Triangular not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(triangular);
  } catch (error) {
    console.error("Error fetching triangular:", error);
    return NextResponse.json(
      { error: "Error fetching triangular", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    
    const triangular = await triangularService.updateTriangular(id, updateData);
    return NextResponse.json(triangular);
  } catch (error) {
    console.error("Error updating triangular:", error);
    return NextResponse.json(
      { error: "Error updating triangular", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await triangularService.deleteTriangular(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting triangular:", error);
    return NextResponse.json(
      { error: "Error deleting triangular", message: (error as Error).message },
      { status: 500 }
    );
  }
} 