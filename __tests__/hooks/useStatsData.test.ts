import { renderHook, act } from "@testing-library/react";
import { useStatsData } from "@/app/graficos/hooks/useStatsData";
import { api } from "@/lib/api";
import { mockPlayers } from "@/store/mocks/stats";
import { StatMetric } from "@/types/stats";
import { ApexOptions } from "apexcharts";

// Mock the api module
jest.mock("@/lib/api", () => ({
  api: {
    players: {
      getAllPlayers: jest.fn(),
    },
  },
}));

// Ensure mock players have normalWins data
const mockPlayersWithNormalWins = mockPlayers.map(player => ({
  ...player,
  stats: {
    ...player.stats,
    normalWins: player.stats.normalWins || Math.floor(player.stats.wins * 0.7), // Add normalWins if not present
  },
}));

describe("useStatsData", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (api.players.getAllPlayers as jest.Mock).mockResolvedValue(mockPlayersWithNormalWins);
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Data Fetching", () => {
    it("loads mock data in development environment", async () => {
      process.env = { ...originalEnv, NODE_ENV: "development" };
      const { result } = renderHook(() => useStatsData());

      // Wait for the useEffect to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.players).toEqual(mockPlayers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("fetches real data in production environment", async () => {
      process.env = { ...originalEnv, NODE_ENV: "production" };
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(api.players.getAllPlayers).toHaveBeenCalled();
      expect(result.current.players).toEqual(mockPlayersWithNormalWins);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("handles API errors", async () => {
      process.env = { ...originalEnv, NODE_ENV: "production" };
      const error = new Error("API Error");
      (api.players.getAllPlayers as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe("Error al cargar los datos. Por favor, intenta nuevamente.");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Player Highlighting", () => {
    it("toggles player highlight state", async () => {
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Highlight a player
      await act(async () => {
        result.current.handlePlayerHighlight("goals", "Rama");
      });

      expect(result.current.highlightedPlayers.goals).toBe("Rama");

      // Unhighlight the same player
      await act(async () => {
        result.current.handlePlayerHighlight("goals", "Rama");
      });

      expect(result.current.highlightedPlayers.goals).toBeNull();
    });
  });

  describe("Players to Show Management", () => {
    it("updates number of players to show", async () => {
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        result.current.handlePlayersToShowChange("goals", 5);
      });

      expect(result.current.playersToShow.goals).toBe(5);
    });
  });

  describe("Chart Data Preparation", () => {
    const metrics: StatMetric[] = ["goals", "wins", "normalWins"];

    it.each(metrics)("prepares chart data for %s metric", async (metric) => {
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const chartData = result.current.prepareChartData(metric);

      // Verify basic structure
      expect(chartData).toMatchObject({
        categories: expect.any(Array),
        colors: expect.any(Array),
        topThree: expect.any(Array),
        totalPlayers: expect.any(Number),
        chartOptions: expect.any(Object),
      });

      // Verify series data
      const series = chartData.series as { name: string; data: number[] }[];
      expect(series).toBeDefined();
      expect(series).toHaveLength(1);
      expect(series[0]).toMatchObject({
        name: expect.any(String),
        data: expect.any(Array),
      });

      // Verify data is sorted correctly
      const values = series[0].data;
      expect(values.length).toBeGreaterThan(0);
      expect([...values].sort((a, b) => b - a)).toEqual(values);
    });

    it.skip('handles empty player data', () => {
      const { result } = renderHook(() => useStatsData());
      
      const chartData = result.current.prepareChartData("goals");

      expect(chartData).toEqual({
        categories: [],
        series: [],
        colors: [],
        chartOptions: {},
        topThree: [],
        totalPlayers: 0,
      });
    });

    it("filters out players with zero values", async () => {
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Add a player with zero goals
      await act(async () => {
        result.current.players.push({
          id: "zero-goals",
          name: "Zero Goals Player",
          stats: {
            matches: 0,
            goals: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            normalWins: 0,
          },
        });
      });

      const chartData = result.current.prepareChartData("goals");
      expect(chartData.categories).not.toContain("Zero Goals Player");
    });

    it("applies correct colors based on player position and highlight state", async () => {
      const { result } = renderHook(() => useStatsData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Highlight the first player
      const firstPlayer = mockPlayersWithNormalWins[0];
      await act(async () => {
        result.current.handlePlayerHighlight("goals", firstPlayer.name);
      });

      const chartData = result.current.prepareChartData("goals");

      // Check if the highlighted player has the highlight color
      const highlightedPlayerIndex = chartData.categories.indexOf(firstPlayer.name);
      expect(chartData.colors[highlightedPlayerIndex]).toBe("#FF5733"); // Highlighted player color

      // Check if non-highlighted players have the correct colors based on position
      chartData.categories.forEach((name, index) => {
        if (index !== highlightedPlayerIndex) {
          if (index === 0) {
            expect(chartData.colors[index]).toBe("#F59E0B"); // First place (gold)
          } else if (index === 1) {
            expect(chartData.colors[index]).toBe("#10B981"); // Second place (green)
          } else if (index === 2) {
            expect(chartData.colors[index]).toBe("#3B82F6"); // Third place (blue)
          } else {
            expect(chartData.colors[index]).toBe("#9CA3AF"); // Regular (gray)
          }
        }
      });
    });
  });
}); 