import { Player } from "@/types";

// Mock player data based on the names in seed.ts
export const mockPlayers: Player[] = [
  {
    id: "1",
    name: "Rama",
    stats: {
      matches: 42,
      goals: 35,
      wins: 18,
      draws: 8,
      losses: 16,
      points: 62
    }
  },
  {
    id: "2",
    name: "Pasko",
    stats: {
      matches: 38,
      goals: 28,
      wins: 15,
      draws: 10,
      losses: 13,
      points: 55
    }
  },
  {
    id: "3",
    name: "Kbz",
    stats: {
      matches: 45,
      goals: 40,
      wins: 22,
      draws: 5,
      losses: 18,
      points: 71
    }
  },
  {
    id: "4",
    name: "Giando",
    stats: {
      matches: 36,
      goals: 22,
      wins: 14,
      draws: 9,
      losses: 13,
      points: 51
    }
  },
  {
    id: "5",
    name: "Tomi",
    stats: {
      matches: 40,
      goals: 32,
      wins: 19,
      draws: 7,
      losses: 14,
      points: 64
    }
  },
  {
    id: "6",
    name: "Cuistone",
    stats: {
      matches: 39,
      goals: 25,
      wins: 16,
      draws: 8,
      losses: 15,
      points: 56
    }
  },
  {
    id: "7",
    name: "Facu",
    stats: {
      matches: 41,
      goals: 30,
      wins: 17,
      draws: 9,
      losses: 15,
      points: 60
    }
  },
  {
    id: "8",
    name: "MatiBc",
    stats: {
      matches: 37,
      goals: 24,
      wins: 15,
      draws: 7,
      losses: 15,
      points: 52
    }
  },
  {
    id: "9",
    name: "Luky",
    stats: {
      matches: 43,
      goals: 38,
      wins: 20,
      draws: 8,
      losses: 15,
      points: 68
    }
  },
  {
    id: "10",
    name: "AgusGue",
    stats: {
      matches: 35,
      goals: 20,
      wins: 13,
      draws: 6,
      losses: 16,
      points: 45
    }
  },
  {
    id: "11",
    name: "MatiSabale",
    stats: {
      matches: 38,
      goals: 26,
      wins: 16,
      draws: 7,
      losses: 15,
      points: 55
    }
  },
  {
    id: "12",
    name: "Nacho",
    stats: {
      matches: 40,
      goals: 29,
      wins: 18,
      draws: 6,
      losses: 16,
      points: 60
    }
  },
  {
    id: "13",
    name: "Pancho",
    stats: {
      matches: 36,
      goals: 23,
      wins: 14,
      draws: 8,
      losses: 14,
      points: 50
    }
  },
  {
    id: "14",
    name: "Kevin",
    stats: {
      matches: 42,
      goals: 33,
      wins: 19,
      draws: 7,
      losses: 16,
      points: 64
    }
  },
  {
    id: "15",
    name: "Mateo",
    stats: {
      matches: 39,
      goals: 27,
      wins: 16,
      draws: 8,
      losses: 15,
      points: 56
    }
  }
];

// Mock data for triangular statistics
export const mockTriangularStats = {
  // Map player IDs to their normalWins (victories by 1 goal)
  normalWins: {
    "1": 8,
    "2": 7,
    "3": 10,
    "4": 6,
    "5": 9,
    "6": 7,
    "7": 8,
    "8": 7,
    "9": 9,
    "10": 6,
    "11": 7,
    "12": 8,
    "13": 6,
    "14": 9,
    "15": 7
  }
};

// Helper function to get mock data
export const getMockData = () => {
  return {
    players: mockPlayers,
    triangularStats: mockTriangularStats
  };
};
