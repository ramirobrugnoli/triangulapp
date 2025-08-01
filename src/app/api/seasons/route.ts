import { NextResponse } from "next/server";
import { seasonService } from "@/lib/services/season";

export async function GET() {
  try {
    const seasons = await seasonService.getAllSeasons();
    return NextResponse.json(seasons);
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      { error: "Error fetching seasons", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, initSeasonDate } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Season name is required" },
        { status: 400 }
      );
    }

    const seasonData: { name: string; initSeasonDate?: Date } = {
      name: name.trim()
    };

    if (initSeasonDate) {
      seasonData.initSeasonDate = new Date(initSeasonDate);
    }

    const season = await seasonService.createSeason(seasonData);
    return NextResponse.json(season);
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      { error: "Error creating season", message: (error as Error).message },
      { status: 500 }
    );
  }
}