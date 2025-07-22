import { render, screen, fireEvent, act } from "@testing-library/react";
import { mockPlayers } from "@/store/mocks/stats";

// Mock dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (component: any) => {
    return () => null;
  },
}));

// Mock react-countup
jest.mock('react-countup', () => ({
  __esModule: true,
  default: ({ end }: { end: number }) => <span>{end}</span>,
}));

// Mock react-apexcharts
jest.mock('react-apexcharts', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-chart">Chart</div>,
}));

// Mock PlayerStatsService
jest.mock("@/lib/services/playerStats", () => ({
  PlayerStatsService: {
    calculatePerformanceData: jest.fn().mockReturnValue({
      winPercentage: 50,
      drawPercentage: 20,
      lossPercentage: 30,
      goalsPerMatch: 1.5,
    }),
    calculatePlayerRating: jest.fn().mockReturnValue(85),
    calculateRatingBreakdown: jest.fn().mockReturnValue({
      pointsComponent: 30,
      winPercentageComponent: 25,
      goalsPerMatchComponent: 30,
      totalRating: 85,
    }),
    calculatePlayerRatingV2: jest.fn().mockReturnValue(65),
    calculateRatingV2Breakdown: jest.fn().mockReturnValue({
      triangularWinPercentageComponent: 30,
      winPercentageComponent: 20,
      totalRatingV2: 65,
    }),
    calculateTriangularAverages: jest.fn().mockReturnValue({
      pointsPerTriangular: 6,
      winsPerTriangular: 2,
      goalsPerTriangular: 1.5,
      matchesPerTriangular: 3,
    }),
    calculateGoalsPerMatch: jest.fn().mockReturnValue(1.5),
    sortPlayersByMetric: jest.fn().mockReturnValue(mockPlayers),
  },
}));

import { PlayerStatsCharts } from "@/components/stats/PlayerStatsCharts";
import { PlayerStatsService } from "@/lib/services/playerStats";

describe("PlayerStatsCharts", () => {
  const mockPlayer = mockPlayers[0];
  const defaultProps = {
    player: mockPlayer,
    allPlayers: mockPlayers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders player name and basic stats", () => {
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    // Check if player name is rendered
    expect(screen.getByText(`Estadísticas de ${mockPlayer.name}`)).toBeInTheDocument();
    
    // Check if basic stats are rendered
    expect(screen.getByText("% de Victorias")).toBeInTheDocument();
    expect(screen.getByText("% de Empates")).toBeInTheDocument();
    expect(screen.getByText("% de Derrotas")).toBeInTheDocument();
  });

  it("calculates and displays performance data", () => {
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    expect(PlayerStatsService.calculatePerformanceData).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculatePlayerRating).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculateRatingBreakdown).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculatePlayerRatingV2).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculateRatingV2Breakdown).toHaveBeenCalledWith(mockPlayer.stats);
    expect(PlayerStatsService.calculateTriangularAverages).toHaveBeenCalledWith(mockPlayer.stats);
  });

  it("displays rating info when toggled", () => {
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    // Initially, rating info should not be visible
    expect(screen.queryByText(/Cálculo del Rating$/i)).not.toBeInTheDocument();
    
    // Click the rating info button
    const ratingButton = screen.getByTitle("Ver cómo se calcula el rating");
    
    act(() => {
      fireEvent.click(ratingButton);
    });
    
    // Rating info should now be visible
    expect(screen.getByText(/Cálculo del Rating$/i)).toBeInTheDocument();
  });

  it("displays rating V2 info when toggled", () => {
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    // Initially, rating V2 info should not be visible
    expect(screen.queryByText(/Cálculo del Rating V2/i)).not.toBeInTheDocument();
    
    // Click the rating V2 info button
    const ratingV2Button = screen.getByTitle("Ver cómo se calcula el rating V2");
    
    act(() => {
      fireEvent.click(ratingV2Button);
    });
    
    // Rating V2 info should now be visible
    expect(screen.getByText(/Cálculo del Rating V2/i)).toBeInTheDocument();
  });

  it("handles empty allPlayers prop", () => {
    act(() => {
      render(<PlayerStatsCharts player={mockPlayer} />);
    });
    
    // Should still render basic stats
    expect(screen.getByText("% de Victorias")).toBeInTheDocument();
    expect(screen.getByText("% de Empates")).toBeInTheDocument();
    expect(screen.getByText("% de Derrotas")).toBeInTheDocument();
    
    // Should not render comparison charts
    expect(screen.queryByText("Comparación de Rating")).not.toBeInTheDocument();
    expect(screen.queryByText("Comparación de Rating V2")).not.toBeInTheDocument();
  });

  it("calculates and displays nearby players data", () => {
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    // Should call sortPlayersByMetric for both rating and ratingV2
    expect(PlayerStatsService.sortPlayersByMetric).toHaveBeenCalledWith(
      mockPlayers,
      'rating'
    );
    expect(PlayerStatsService.sortPlayersByMetric).toHaveBeenCalledWith(
      mockPlayers,
      'ratingV2'
    );
    expect(PlayerStatsService.sortPlayersByMetric).toHaveBeenCalledWith(
      mockPlayers,
      'points'
    );
  });

  it("renders comparison charts when allPlayers is provided", () => {
    // Mock the sort function to return a subset that includes the current player
    const mockSortedPlayers = [mockPlayers[0], mockPlayers[1], mockPlayers[2]];
    (PlayerStatsService.sortPlayersByMetric as jest.Mock).mockReturnValue(mockSortedPlayers);
    
    act(() => {
      render(<PlayerStatsCharts {...defaultProps} />);
    });
    
    // Should render both comparison charts
    expect(screen.getByText("Comparación de Rating")).toBeInTheDocument();
    expect(screen.getByText("Comparación de Rating V2")).toBeInTheDocument();
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

    act(() => {
      render(<PlayerStatsCharts player={playerWithNoStats} allPlayers={mockPlayers} />);
    });
    
    // Should still render but with zero values
    expect(screen.getByText("% de Victorias")).toBeInTheDocument();
    expect(screen.getAllByText("0%")).toHaveLength(3); // Victory, Draw, and Loss percentages
  });
}); 