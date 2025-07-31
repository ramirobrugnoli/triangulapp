import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface Season {
  id: string;
  name: string;
  initSeasonDate: Date;
  finishSeasonDate: Date | null;
  createdAt: Date;
  triangularCount?: number;
}

export interface CreateSeasonData {
  name: string;
  initSeasonDate?: Date;
}

export class SeasonService {
  async getAllSeasons(): Promise<Season[]> {
    const seasons = await prisma.season.findMany({
      include: {
        _count: {
          select: {
            triangulars: true
          }
        }
      },
      orderBy: {
        initSeasonDate: 'desc'
      }
    });

    return seasons.map(season => ({
      id: season.id,
      name: season.name,
      initSeasonDate: season.initSeasonDate,
      finishSeasonDate: season.finishSeasonDate,
      createdAt: season.createdAt,
      triangularCount: season._count.triangulars
    }));
  }

  async getActiveSeason(): Promise<Season | null> {
    const activeSeason = await prisma.season.findFirst({
      where: {
        finishSeasonDate: null
      },
      include: {
        _count: {
          select: {
            triangulars: true
          }
        }
      },
      orderBy: {
        initSeasonDate: 'desc'
      }
    });

    if (!activeSeason) return null;

    return {
      id: activeSeason.id,
      name: activeSeason.name,
      initSeasonDate: activeSeason.initSeasonDate,
      finishSeasonDate: activeSeason.finishSeasonDate,
      createdAt: activeSeason.createdAt,
      triangularCount: activeSeason._count.triangulars
    };
  }

  async createSeason(data: CreateSeasonData): Promise<Season> {
    const now = new Date();
    const initDate = data.initSeasonDate || now;

    // Close the previous active season if it exists
    const activeSeason = await this.getActiveSeason();
    if (activeSeason) {
      await prisma.season.update({
        where: { id: activeSeason.id },
        data: { finishSeasonDate: initDate }
      });
    }

    // Create the new season
    const newSeason = await prisma.season.create({
      data: {
        name: data.name,
        initSeasonDate: initDate,
        finishSeasonDate: null
      },
      include: {
        _count: {
          select: {
            triangulars: true
          }
        }
      }
    });

    return {
      id: newSeason.id,
      name: newSeason.name,
      initSeasonDate: newSeason.initSeasonDate,
      finishSeasonDate: newSeason.finishSeasonDate,
      createdAt: newSeason.createdAt,
      triangularCount: newSeason._count.triangulars
    };
  }

  async moveTriangularToSeason(triangularId: string, seasonId: string): Promise<void> {
    // Verify the season exists
    const season = await prisma.season.findUnique({
      where: { id: seasonId }
    });

    if (!season) {
      throw new Error('Season not found');
    }

    // Verify the triangular exists
    const triangular = await prisma.triangular.findUnique({
      where: { id: triangularId }
    });

    if (!triangular) {
      throw new Error('Triangular not found');
    }

    // Move the triangular to the new season
    await prisma.triangular.update({
      where: { id: triangularId },
      data: { seasonId }
    });
  }

  async getSeasonById(id: string): Promise<Season | null> {
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            triangulars: true
          }
        }
      }
    });

    if (!season) return null;

    return {
      id: season.id,
      name: season.name,
      initSeasonDate: season.initSeasonDate,
      finishSeasonDate: season.finishSeasonDate,
      createdAt: season.createdAt,
      triangularCount: season._count.triangulars
    };
  }

  async updateSeasonName(id: string, name: string): Promise<Season> {
    // Verify the season exists first
    const existingSeason = await this.getSeasonById(id);
    if (!existingSeason) {
      throw new Error('Season not found');
    }

    // Update the season name
    const updatedSeason = await prisma.season.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: {
            triangulars: true
          }
        }
      }
    });

    return {
      id: updatedSeason.id,
      name: updatedSeason.name,
      initSeasonDate: updatedSeason.initSeasonDate,
      finishSeasonDate: updatedSeason.finishSeasonDate,
      createdAt: updatedSeason.createdAt,
      triangularCount: updatedSeason._count.triangulars
    };
  }
}

export const seasonService = new SeasonService();