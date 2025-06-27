import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TeamsBuilder } from "@/components/teamsbuilder/TeamsBuilder";
import { useGameStore } from "@/store/gameStore";
import { mockPlayers } from "@/store/mocks/stats";
import { PlayerStatsService } from "@/lib/services/playerStats";
import { DndContext } from "@dnd-kit/core";
import type { GameState } from "@/types";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: jest.fn(),
  ToastContainer: () => null,
}));

// Mock useGameStore
const mockUseGameStore = jest.fn();
jest.mock("@/store/gameStore", () => ({
  useGameStore: () => mockUseGameStore(),
}));

// Mock PlayerStatsService
jest.mock("@/lib/services/playerStats", () => ({
  PlayerStatsService: {
    calculatePlayerRating: jest.fn().mockReturnValue(85),
  },
}));

describe.skip("TeamsBuilder", () => {
  const mockSetTeams = jest.fn();
  const mockSelectedPlayers = mockPlayers.slice(0, 6); // Take first 6 players

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockReturnValue({
      setTeams: mockSetTeams,
      selectedPlayers: mockSelectedPlayers,
      teamBuilder: {
        available: mockSelectedPlayers,
        team1: [],
        team2: [],
        team3: [],
      },
    } as Partial<GameState>);
  });

  it("renders initial state with available players", () => {
    render(<TeamsBuilder />);
    
    // Check if team sections are rendered
    expect(screen.getByText("Equipo 1")).toBeInTheDocument();
    expect(screen.getByText("Equipo 2")).toBeInTheDocument();
    expect(screen.getByText("Equipo 3")).toBeInTheDocument();
    
    // Check if players are rendered in available section
    mockSelectedPlayers.forEach(player => {
      expect(screen.getByText(player.name)).toBeInTheDocument();
    });
  });

  it("calculates team ratings", () => {
    render(<TeamsBuilder />);
    
    expect(PlayerStatsService.calculatePlayerRating).toHaveBeenCalled();
    expect(screen.getAllByText(/Rating:/i)).toHaveLength(3); // One for each team
  });

  it("handles player selection", () => {
    render(<TeamsBuilder />);
    
    const player = mockSelectedPlayers[0];
    fireEvent.click(screen.getByText(player.name));
    
    // Selected player should have different styling
    expect(screen.getByText(player.name).closest("button")).toHaveClass("bg-green-600");
  });

  it("redirects to player selection if no players selected", () => {
    const mockRouter = { push: jest.fn() };
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    mockUseGameStore.mockReturnValue({
      setTeams: mockSetTeams,
      selectedPlayers: [], // Empty array
      teamBuilder: {
        available: [],
        team1: [],
        team2: [],
        team3: [],
      },
    } as Partial<GameState>);

    render(<TeamsBuilder />);
    
    expect(mockRouter.push).toHaveBeenCalledWith("/jugadores");
  });

  it("handles random team distribution", () => {
    render(<TeamsBuilder />);
    
    const randomButton = screen.getByText(/Aleatorio/i);
    fireEvent.click(randomButton);
    
    // Check if players are distributed
    const team1Count = screen.getByText("Equipo 1").closest("div")?.querySelectorAll("button").length;
    const team2Count = screen.getByText("Equipo 2").closest("div")?.querySelectorAll("button").length;
    const team3Count = screen.getByText("Equipo 3").closest("div")?.querySelectorAll("button").length;
    
    expect(team1Count).toBeGreaterThan(0);
    expect(team2Count).toBeGreaterThan(0);
    expect(team3Count).toBeGreaterThan(0);
  });

  it("handles team suggestion by stats", async () => {
    render(<TeamsBuilder />);
    
    const suggestButton = screen.getByText(/Sugerir por Stats/i);
    fireEvent.click(suggestButton);
    
    await waitFor(() => {
      // Check if players are distributed based on stats
      const team1Count = screen.getByText("Equipo 1").closest("div")?.querySelectorAll("button").length;
      const team2Count = screen.getByText("Equipo 2").closest("div")?.querySelectorAll("button").length;
      const team3Count = screen.getByText("Equipo 3").closest("div")?.querySelectorAll("button").length;
      
      expect(team1Count).toBeGreaterThan(0);
      expect(team2Count).toBeGreaterThan(0);
      expect(team3Count).toBeGreaterThan(0);
    });
  });

  it("prevents team overflow", () => {
    render(<TeamsBuilder />);
    
    // Try to add more than 5 players to a team
    const players = mockSelectedPlayers.slice(0, 6);
    players.forEach(player => {
      const playerElement = screen.getByText(player.name);
      fireEvent.click(playerElement);
      
      // Simulate drag to team 1
      const team1 = screen.getByText("Equipo 1").closest("div");
      fireEvent.dragStart(playerElement);
      fireEvent.drop(team1!);
    });
    
    // Check if warning is shown
    expect(screen.getByText("(5/5)")).toHaveClass("text-red-400");
  });

  it("handles team confirmation", async () => {
    const mockRouter = { push: jest.fn() };
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<TeamsBuilder />);
    
    // Distribute players to teams
    const confirmButton = screen.getByText(/Confirmar Equipos/i);
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockSetTeams).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/anotador");
    });
  });

  it("prevents confirmation with uneven teams", async () => {
    render(<TeamsBuilder />);
    
    // Leave teams uneven
    const confirmButton = screen.getByText(/Confirmar Equipos/i);
    fireEvent.click(confirmButton);
    
    // Should show warning toast
    expect(require("react-toastify").toast).toHaveBeenCalledWith(
      expect.stringContaining("Los equipos deben tener la misma cantidad de jugadores")
    );
  });
}); 