import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlayerTriangularHistory } from "@/components/stats/PlayerTriangularHistory";
import { api } from "@/lib/api";
import { mockPlayers } from "@/store/mocks/stats";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock api
jest.mock("@/lib/api", () => ({
  api: {
    players: {
      getPlayerTriangulars: jest.fn(),
    },
  },
}));

describe("PlayerTriangularHistory", () => {
  const mockPlayerId = mockPlayers[0].id;
  const mockPlayerName = mockPlayers[0].name;
  const mockTriangulars = [
    {
      id: "1",
      date: new Date("2024-02-19").toISOString(),
      position: 1,
      points: 6,
      wins: 2,
      draws: 0,
      goals: 3,
      playerTeam: "Equipo 1",
      champion: "Equipo 1",
      teams: [
        { 
          teamName: "Equipo 1",
          position: 1,
          points: 6,
          wins: 2,
          draws: 0,
          normalWins: 1,
        },
        { 
          teamName: "Equipo 2",
          position: 2,
          points: 3,
          wins: 1,
          draws: 0,
          normalWins: 1,
        },
      ],
      teamPlayers: {
        "Equipo 1": [
          { id: mockPlayerId, name: mockPlayerName },
          { id: "2", name: "Player 2" },
        ],
        "Equipo 2": [
          { id: "3", name: "Player 3" },
          { id: "4", name: "Player 4" },
        ],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.players.getPlayerTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
  });

  it("renders loading state initially", () => {
    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    expect(screen.getByText("Triangulares Jugados")).toBeInTheDocument();
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("fetches and displays player triangular history", async () => {
    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    await waitFor(() => {
      expect(screen.getByText("Total: 1 triangulares")).toBeInTheDocument();
    });

    expect(screen.getByText("1er Lugar")).toBeInTheDocument();
    expect(screen.getByText("18/02/2024")).toBeInTheDocument();
    expect(screen.getByText("Puntos")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("displays team information when toggled", async () => {
    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    await waitFor(() => {
      expect(screen.getByText("Total: 1 triangulares")).toBeInTheDocument();
    });

    // Click to show teams
    fireEvent.click(screen.getByText("Mostrar Equipos"));
    
    // Check if team members are displayed
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });

  it("handles API errors", async () => {
    const error = new Error("API Error");
    (api.players.getPlayerTriangulars as jest.Mock).mockRejectedValue(error);

    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    await waitFor(() => {
      expect(screen.getByText("Error al cargar los triangulares del jugador")).toBeInTheDocument();
    });
  });

  it("navigates to triangular details when clicked", async () => {
    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    await waitFor(() => {
      expect(screen.getByText("Total: 1 triangulares")).toBeInTheDocument();
    });

    // Click on the triangular card
    fireEvent.click(screen.getByText("1er Lugar").closest("div")!.parentElement!);
    
    expect(mockPush).toHaveBeenCalledWith(`/historial?triangularId=1&playerId=1`);
  });

  it("handles empty triangular history", async () => {
    (api.players.getPlayerTriangulars as jest.Mock).mockResolvedValue([]);

    render(<PlayerTriangularHistory playerId={mockPlayerId} playerName={mockPlayerName} />);
    
    await waitFor(() => {
      expect(screen.getByText("Este jugador no ha participado en ningún triangular aún.")).toBeInTheDocument();
    });
  });
}); 