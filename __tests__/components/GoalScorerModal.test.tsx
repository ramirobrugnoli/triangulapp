import { render, screen, fireEvent } from "@testing-library/react";
import { GoalScorerModal } from "@/components/game/GoalScorerModal";
import { mockPlayers } from "@/store/mocks/stats";

describe("GoalScorerModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();
  const mockTeamMembers = mockPlayers.slice(0, 3).map(({ id, name }) => ({ id, name }));

  const defaultProps = {
    isOpen: true,
    team: "A" as const,
    players: mockTeamMembers,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(<GoalScorerModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Seleccionar Goleador/)).not.toBeInTheDocument();
  });

  it("renders modal with correct title when open", () => {
    render(<GoalScorerModal {...defaultProps} />);
    expect(screen.getByText("Seleccionar Goleador - Equipo A")).toBeInTheDocument();
  });

  it("renders all player buttons", () => {
    render(<GoalScorerModal {...defaultProps} />);
    mockTeamMembers.forEach((player) => {
      expect(screen.getByText(player.name)).toBeInTheDocument();
    });
  });

  it("calls onSelect and onClose when a player is selected", () => {
    render(<GoalScorerModal {...defaultProps} />);
    const firstPlayerButton = screen.getByText(mockTeamMembers[0].name);
    fireEvent.click(firstPlayerButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockTeamMembers[0].id);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<GoalScorerModal {...defaultProps} />);
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("displays team name correctly for team B", () => {
    render(<GoalScorerModal {...defaultProps} team="B" />);
    expect(screen.getByText("Seleccionar Goleador - Equipo B")).toBeInTheDocument();
  });

  it("renders with empty player list", () => {
    render(<GoalScorerModal {...defaultProps} players={[]} />);
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: mockTeamMembers[0].name })).not.toBeInTheDocument();
  });
}); 