import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrentMatch } from '@/components/game/CurrentMatch';
import { useGameStore } from '@/store/gameStore';
import { act } from 'react-dom/test-utils';
import type { GameState } from '@/types';

// Mock the store
const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
jest.mock('@/store/gameStore', () => ({
  useGameStore: jest.fn(),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: jest.fn(),
  ToastContainer: () => null,
}));

// Mock child components
jest.mock('@/components/game/GameTimer', () => ({
  GameTimer: () => <div data-testid="game-timer">Game Timer</div>,
}));

jest.mock('@/components/game/ScoreBoard', () => ({
  ScoreBoard: ({ onGoalTeamA, onGoalTeamB }: any) => (
    <div data-testid="score-board">
      <button onClick={onGoalTeamA}>Goal Team A</button>
      <button onClick={onGoalTeamB}>Goal Team B</button>
    </div>
  ),
}));

jest.mock('@/components/game/DailyScoreTable', () => ({
  DailyScoreTable: () => <div data-testid="daily-score-table">Daily Scores</div>,
}));

jest.mock('@/components/game/DailyScorersTable', () => ({
  DailyScorersTable: () => <div data-testid="daily-scorers-table">Daily Scorers</div>,
}));

jest.mock('@/components/game/MatchHistory', () => ({
  MatchHistory: () => <div data-testid="match-history">Match History</div>,
}));

// Mock GoalScorerModal
jest.mock('@/components/game/GoalScorerModal', () => ({
  GoalScorerModal: ({ isOpen, team, players, onClose, onSelect }: any) => (
    isOpen ? (
      <div role="dialog" aria-modal="true" data-testid="goal-scorer-modal">
        <h3>Seleccionar Goleador - Equipo {team}</h3>
        <div>
          {players.map((player: any) => (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              data-testid={`player-button-${player.id}`}
            >
              {player.name}
            </button>
          ))}
        </div>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null
  ),
}));

// Mock EditLastMatchModal
jest.mock('@/components/game/EditLastMatchModal', () => ({
  EditLastMatchModal: ({ isOpen, onClose, lastMatch, onSave }: any) => (
    isOpen ? (
      <div data-testid="edit-match-modal">
        <h2>Editar Partido</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

const mockStore = {
  activeTeams: {
    teamA: {
      name: 'Equipo 1',
      members: [
        { id: '1', name: 'Player 1' },
        { id: '2', name: 'Player 2' },
      ],
    },
    teamB: {
      name: 'Equipo 2',
      members: [
        { id: '3', name: 'Player 3' },
        { id: '4', name: 'Player 4' },
      ],
    },
    waiting: {
      name: 'Equipo 3',
      members: [
        { id: '5', name: 'Player 5' },
        { id: '6', name: 'Player 6' },
      ],
    },
  },
  scores: {
    teamA: 0,
    teamB: 0,
  },
  currentMatchGoals: {},
  dailyScores: [
    { name: 'Equipo 1', points: 3, position: 1 },
    { name: 'Equipo 2', points: 1, position: 2 },
    { name: 'Equipo 3', points: 0, position: 3 },
  ],
  matchEndModal: {
    isOpen: false,
    result: null,
    preCalculatedDrawChoice: null,
  },
  lastWinner: null,
  lastDraw: false,
  setIsActive: jest.fn(),
  updateScore: jest.fn(),
  registerGoal: jest.fn(),
  getCurrentMatchGoals: jest.fn(),
  finalizeTriangular: jest.fn(),
  stopTimer: jest.fn(),
  getLastMatch: jest.fn(),
  editLastMatch: jest.fn(),
  showMatchEndModal: jest.fn(),
  acceptMatchEnd: jest.fn(),
  getMatchHistory: jest.fn().mockReturnValue([]),
} as const;

describe('CurrentMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockImplementation(() => mockStore);
  });

  it('renders all components correctly', () => {
    render(<CurrentMatch />);

    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
    expect(screen.getByTestId('score-board')).toBeInTheDocument();
    expect(screen.getByTestId('daily-score-table')).toBeInTheDocument();
    expect(screen.getByTestId('daily-scorers-table')).toBeInTheDocument();
    expect(screen.getByTestId('match-history')).toBeInTheDocument();
  });

  it('displays team names and players', () => {
    render(<CurrentMatch />);

    // Check team names
    expect(screen.getByText('Amarillo')).toBeInTheDocument();
    expect(screen.getByText('Rosa')).toBeInTheDocument();
    expect(screen.getByText('Negro')).toBeInTheDocument();

    // Check players
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();
    expect(screen.getByText('Player 5')).toBeInTheDocument();
    expect(screen.getByText('Player 6')).toBeInTheDocument();
  });

  it('handles goal scoring for team A', async () => {
    mockStore.getCurrentMatchGoals.mockReturnValue(1);
    
    render(<CurrentMatch />);
    
    // Click goal button for team A
    fireEvent.click(screen.getByText('Goal Team A'));
    
    // Check if goal scorer modal opens and find the player button in the modal
    await waitFor(() => {
      const modal = screen.getByTestId('goal-scorer-modal');
      const playerButton = screen.getByTestId('player-button-1');
      fireEvent.click(playerButton);
    });

    expect(mockStore.registerGoal).toHaveBeenCalledWith('1');
    expect(mockStore.updateScore).toHaveBeenCalledWith('A', 1);
  });

  it('handles goal scoring for team B', async () => {
    mockStore.getCurrentMatchGoals.mockReturnValue(1);
    
    render(<CurrentMatch />);
    
    // Click goal button for team B
    fireEvent.click(screen.getByText('Goal Team B'));
    
    // Check if goal scorer modal opens and find the player button in the modal
    await waitFor(() => {
      const modal = screen.getByTestId('goal-scorer-modal');
      const playerButton = screen.getByTestId('player-button-3');
      fireEvent.click(playerButton);
    });

    expect(mockStore.registerGoal).toHaveBeenCalledWith('3');
    expect(mockStore.updateScore).toHaveBeenCalledWith('B', 1);
  });

  it('shows match end modal when a team scores 2 goals', async () => {
    mockStore.getCurrentMatchGoals.mockReturnValue(2);
    
    render(<CurrentMatch />);
    
    // Click goal button for team A
    fireEvent.click(screen.getByText('Goal Team A'));
    
    // Select a scorer from the modal
    await waitFor(() => {
      const modal = screen.getByTestId('goal-scorer-modal');
      const playerButton = screen.getByTestId('player-button-1');
      fireEvent.click(playerButton);
    });

    expect(mockStore.setIsActive).toHaveBeenCalledWith(false);
    expect(mockStore.stopTimer).toHaveBeenCalled();
    expect(mockStore.showMatchEndModal).toHaveBeenCalledWith('A');
  });

  it('handles finalizing triangular', async () => {
    render(<CurrentMatch />);
    
    const finalizeButton = screen.getByText('Finalizar Triangular');
    fireEvent.click(finalizeButton);

    await waitFor(() => {
      expect(mockStore.finalizeTriangular).toHaveBeenCalled();
    });
  });

  it('handles editing last match', async () => {
    const mockLastMatch = {
      teamA: { 
        name: 'Equipo 1', 
        score: 2,
        members: [
          { id: '1', name: 'Player 1' },
          { id: '2', name: 'Player 2' },
        ],
      },
      teamB: { 
        name: 'Equipo 2', 
        score: 1,
        members: [
          { id: '3', name: 'Player 3' },
          { id: '4', name: 'Player 4' },
        ],
      },
      scorers: { '1': 2 },
    };
    mockStore.getLastMatch.mockReturnValue(mockLastMatch);
    
    render(<CurrentMatch />);
    
    const editButton = screen.getByText('Editar Último Partido');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('edit-match-modal')).toBeInTheDocument();
    });
  });

  it('disables edit button when no last match exists', () => {
    mockStore.getLastMatch.mockReturnValue(null);
    
    render(<CurrentMatch />);
    
    const editButton = screen.getByText('Editar Último Partido');
    expect(editButton).toBeDisabled();
  });

  it('displays goal indicators correctly', () => {
    const goalsStore = {
      ...mockStore,
      currentMatchGoals: {
        '1': 1,  // Single goal
        '2': 2,  // Multiple goals
      },
    };
    mockUseGameStore.mockImplementation(() => goalsStore);
    
    render(<CurrentMatch />);

    // Check for single goal indicator
    const player1 = screen.getByText('Player 1');
    expect(player1.parentElement).toHaveTextContent('⚽');

    // Check for multiple goals indicator
    const player2 = screen.getByText('Player 2');
    expect(player2.parentElement).toHaveTextContent('⚽ x2');
  });
}); 