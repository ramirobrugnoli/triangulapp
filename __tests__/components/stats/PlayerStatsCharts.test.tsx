import { render, screen } from "@testing-library/react";
import { mockPlayers } from "@/store/mocks/stats";

// Mock dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (...args: any[]) => {
    const dynamicModule = jest.requireActual("next/dynamic");
    const mockComponent = () => null;
    return dynamicModule.default(args[0], { ...args[1], loading: () => null });
  },
}));

// Mock PlayerStatsService
jest.mock("@/lib/services/playerStats", () => ({
  PlayerStatsService: {
    calculatePerformanceData: jest.fn().mockReturnValue({
      winRate: 50,
      drawRate: 20,
      lossRate: 30,
      goalsPerMatch: 1.5,
      pointsPerMatch: 2.0,
    }),
    calculatePlayerRating: jest.fn().mockReturnValue(85),
    calculateRatingBreakdown: jest.fn().mockReturnValue({
      winRating: 30,
      goalRating: 25,
      consistencyRating: 30,
    }),
    calculateTriangularAverages: jest.fn().mockReturnValue({
      pointsPerTriangular: 6,
      winsPerTriangular: 2,
      goalsPerTriangular: 1.5,
      matchesPerTriangular: 3,
    }),
    sortPlayersByMetric: jest.fn().mockReturnValue(mockPlayers),
  },
}));

import { PlayerStatsCharts } from "@/components/stats/PlayerStatsCharts";
import { PlayerStatsService } from "@/lib/services/playerStats";

describe.skip("PlayerStatsCharts", () => {
  const mockPlayer = mockPlayers[0];
  const defaultProps = {
    player: mockPlayer,
    allPlayers: mockPlayers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders player name and basic stats", () => {
    render(<PlayerStatsCharts {...defaultProps} />);
    
    // Check if player name is rendered
    expect(screen.getByText(mockPlayer.name)).toBeInTheDocument();
    
    // Check if basic stats are rendered
    expect(screen.getByText("Victorias")).toBeInTheDocument();
    expect(screen.getByText("Empates")).toBeInTheDocument();
    expect(screen.getByText("Derrotas")).toBeInTheDocument();
  });

  it("calculates and displays performance data", () => {
    render(<PlayerStatsCharts {...defaultProps} />);
    
    expect(PlayerStatsService.calculatePerformanceData).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculatePlayerRating).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculateRatingBreakdown).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculateTriangularAverages).toHaveBeenCalledWith(mockPlayer.stats);
  });

  it("displays rating info when toggled", () => {
    render(<PlayerStatsCharts {...defaultProps} />);
    
    // Initially, rating info should not be visible
    expect(screen.queryByText(/Desglose del Rating/i)).not.toBeInTheDocument();
    
    // Click the rating info button
    const ratingButton = screen.getByRole("button", { name: /rating/i });
    ratingButton.click();
    
    // Rating info should now be visible
    expect(screen.getByText(/Desglose del Rating/i)).toBeInTheDocument();
  });

  it("handles empty allPlayers prop", () => {
    render(<PlayerStatsCharts player={mockPlayer} />);
    
    // Should still render basic stats
    expect(screen.getByText("Victorias")).toBeInTheDocument();
    expect(screen.getByText("Empates")).toBeInTheDocument();
    expect(screen.getByText("Derrotas")).toBeInTheDocument();
    
    // Should not render comparison charts
    expect(screen.queryByText(/Comparación/i)).not.toBeInTheDocument();
  });

  it("calculates and displays nearby players data", () => {
    render(<PlayerStatsCharts {...defaultProps} />);
    
    expect(PlayerStatsService.sortPlayersByMetric).toHaveBeenCalledWith(
      mockPlayers,
      expect.any(String)
    );
  });

  it("handles player with no stats", () => {
    const playerWithNoStats = {
      ...mockPlayer,
      stats: {
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        normalWins: 0,
      },
    };

    render(<PlayerStatsCharts player={playerWithNoStats} allPlayers={mockPlayers} />);
    
    // Should still render but with zero values
    expect(screen.getByText("Victorias")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
}); 