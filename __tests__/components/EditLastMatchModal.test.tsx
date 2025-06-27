import { render, screen, fireEvent } from '@testing-library/react';
import { EditLastMatchModal } from '@/components/game/EditLastMatchModal';
import { MatchRecord } from '@/types';

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

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('EditLastMatchModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createDrawMatch = (): MatchRecord => ({
    teamA: {
      name: "Equipo 1",
      members: [
        { id: "player1", name: "Jugador 1" },
        { id: "player2", name: "Jugador 2" }
      ],
      score: 1
    },
    teamB: {
      name: "Equipo 2", 
      members: [
        { id: "player3", name: "Jugador 3" },
        { id: "player4", name: "Jugador 4" }
      ],
      score: 1
    },
    waiting: {
      name: "Equipo 3",
      members: [
        { id: "player5", name: "Jugador 5" }
      ]
    },
    goals: {
      "player1": 1,
      "player3": 1
    },
    result: "draw",
    timestamp: Date.now()
  });

  const createZeroDrawMatch = (): MatchRecord => ({
    teamA: {
      name: "Equipo 1",
      members: [
        { id: "player1", name: "Jugador 1" },
        { id: "player2", name: "Jugador 2" }
      ],
      score: 0
    },
    teamB: {
      name: "Equipo 2", 
      members: [
        { id: "player3", name: "Jugador 3" },
        { id: "player4", name: "Jugador 4" }
      ],
      score: 0
    },
    waiting: {
      name: "Equipo 3",
      members: [
        { id: "player5", name: "Jugador 5" }
      ]
    },
    goals: {},
    result: "draw",
    timestamp: Date.now()
  });

  it('should display draw match data correctly', () => {
    const drawMatch = createDrawMatch();
    
    render(
      <EditLastMatchModal
        isOpen={true}
        onClose={mockOnClose}
        lastMatch={drawMatch}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Editar Último Partido')).toBeInTheDocument();
    expect(screen.getAllByText('Amarillo')).toHaveLength(2); // Once in score, once in goalscorers
    expect(screen.getAllByText('Rosa')).toHaveLength(2); // Once in score, once in goalscorers
    
    // Check scores are displayed
    expect(screen.getAllByText('1')).toHaveLength(4); // 2 scores + 2 goals
    
    // Check result shows draw
    expect(screen.getByText('Empate')).toBeInTheDocument();
  });

  it('should show add buttons for draw match', () => {
    const drawMatch = createDrawMatch();
    
    render(
      <EditLastMatchModal
        isOpen={true}
        onClose={mockOnClose}
        lastMatch={drawMatch}
        onSave={mockOnSave}
      />
    );

    // Should show add buttons for both teams
    const addButtons = screen.getAllByText('+');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('should display 0-0 draw match correctly', () => {
    const zeroDrawMatch = createZeroDrawMatch();
    
    render(
      <EditLastMatchModal
        isOpen={true}
        onClose={mockOnClose}
        lastMatch={zeroDrawMatch}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Editar Último Partido')).toBeInTheDocument();
    
    // Check scores are displayed as 0
    expect(screen.getAllByText('0')).toHaveLength(6); // 2 scores + 4 player goals
    
    // Check result shows draw
    expect(screen.getByText('Empate')).toBeInTheDocument();
    
    // Should show add buttons even for 0-0
    const addButtons = screen.getAllByText('+');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('should allow editing score of draw match', () => {
    const drawMatch = createDrawMatch();
    
    render(
      <EditLastMatchModal
        isOpen={true}
        onClose={mockOnClose}
        lastMatch={drawMatch}
        onSave={mockOnSave}
      />
    );

    // Find and click the add button for team A
    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]); // Assuming first button is for team A

    // Should be able to click without errors
    expect(addButtons[0]).toBeEnabled();
  });

  it('should not render when closed or no match', () => {
    render(
      <EditLastMatchModal
        isOpen={false}
        onClose={mockOnClose}
        lastMatch={null}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Editar Último Partido')).not.toBeInTheDocument();
  });
}); 