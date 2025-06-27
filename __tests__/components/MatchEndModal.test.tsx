import { render, screen, fireEvent } from '@testing-library/react';
import { MatchEndModal } from '@/components/game/MatchEndModal';
import { Team } from '@/types';
import '@testing-library/jest-dom';

// Mock the helpers
jest.mock('@/lib/helpers/helpers', () => ({
  getColorByTeam: (team: string) => {
    const colors: { [key: string]: string } = {
      "Equipo 1": "Amarillo",
      "Equipo 2": "Rosa", 
      "Equipo 3": "Negro"
    };
    return colors[team] || team;
  }
}));

describe('MatchEndModal', () => {
  const mockOnAccept = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    result: "A" as const,
    teamA: "Equipo 1" as Team,
    teamB: "Equipo 2" as Team,
    waitingTeam: "Equipo 3" as Team,
    onAccept: mockOnAccept,
    gameState: { lastWinner: "", lastDraw: "", preCalculatedDrawChoice: null },
  };

  it('should not render when closed', () => {
    render(
      <MatchEndModal
        {...defaultProps}
        isOpen={false}
      />
    );
    
    expect(screen.queryByText('Aceptar')).not.toBeInTheDocument();
  });

  it('should show victory message for team A with colors', () => {
    render(
      <MatchEndModal
        {...defaultProps}
        result="A"
      />
    );
    
    expect(screen.getByText('Ganó Amarillo')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    expect(screen.getByText('Amarillo')).toBeInTheDocument();
  });

  it('should show victory message for team B with colors', () => {
    render(
      <MatchEndModal
        {...defaultProps}
        result="B"
      />
    );
    
    expect(screen.getByText('Ganó Rosa')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    expect(screen.getByText('Rosa')).toBeInTheDocument();
  });

  it('should show draw message with correct team staying', () => {
    // Test empate donde A había jugado en el partido anterior
    render(<MatchEndModal 
      {...defaultProps} 
      result="draw" 
      gameState={{ lastWinner: "A", lastDraw: "", preCalculatedDrawChoice: null }}
    />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    // B se queda porque A había jugado en el partido anterior
    expect(screen.getByText('Rosa')).toBeInTheDocument();
  });

  it('should show draw message when B played in previous match', () => {
    // Test empate donde B había jugado en el partido anterior
    render(<MatchEndModal 
      {...defaultProps} 
      result="draw" 
      gameState={{ lastWinner: "B", lastDraw: "", preCalculatedDrawChoice: null }}
    />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    // A se queda porque B había jugado en el partido anterior
    expect(screen.getByText('Amarillo')).toBeInTheDocument();
  });

  it('should show specific team for first match draw with pre-calculated choice A', () => {
    // Test empate en primer partido con choice pre-calculado A
    render(<MatchEndModal 
      {...defaultProps} 
      result="draw" 
      gameState={{ lastWinner: "", lastDraw: "", preCalculatedDrawChoice: "A" }}
    />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    expect(screen.getByText('Amarillo')).toBeInTheDocument();
  });

  it('should show specific team for first match draw with pre-calculated choice B', () => {
    // Test empate en primer partido con choice pre-calculado B
    render(<MatchEndModal 
      {...defaultProps} 
      result="draw" 
      gameState={{ lastWinner: "", lastDraw: "", preCalculatedDrawChoice: "B" }}
    />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    expect(screen.getByText('Rosa')).toBeInTheDocument();
  });

  it('should show generic message for first match draw without pre-calculated choice', () => {
    // Test empate en primer partido sin choice pre-calculado
    render(<MatchEndModal 
      {...defaultProps} 
      result="draw" 
      gameState={{ lastWinner: "", lastDraw: "", preCalculatedDrawChoice: null }}
    />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('Se queda en cancha el equipo')).toBeInTheDocument();
    expect(screen.getByText('el equipo que se quede')).toBeInTheDocument();
  });

  it('should call onAccept when button is clicked', () => {
    render(
      <MatchEndModal
        {...defaultProps}
      />
    );
    
    const acceptButton = screen.getByText('Aceptar');
    fireEvent.click(acceptButton);
    
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('should have proper styling classes', () => {
    render(
      <MatchEndModal
        {...defaultProps}
      />
    );
    
    const modalContainer = screen.getByRole('dialog', { hidden: true });
    expect(modalContainer).toHaveClass('bg-gray-900');
    
    const button = screen.getByText('Aceptar');
    expect(button).toHaveClass('bg-blue-600');
  });
}); 