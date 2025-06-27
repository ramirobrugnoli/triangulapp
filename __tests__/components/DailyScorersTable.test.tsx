import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DailyScorersTable } from '@/components/game/DailyScorersTable';
import { useGameStore } from '@/store/gameStore';

jest.mock('@/store/gameStore');
const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;

const mockTeamsWithPlayers = {
  teamA: {
    members: [
      { id: 'player1', name: 'Juan' },
      { id: 'player2', name: 'Pedro' },
    ]
  },
  teamB: {
    members: [
      { id: 'player3', name: 'Ana' },
    ]
  },
  waiting: {
    members: []
  }
};

describe('DailyScorersTable Component', () => {
  it('should render the scorers table with goals', () => {
    mockUseGameStore.mockReturnValue({
      currentGoals: {
        'player1': 3,
        'player2': 2,
        'player3': 1,
      },
      activeTeams: mockTeamsWithPlayers,
    } as any);

    const { getByText } = render(<DailyScorersTable />);
    
    expect(getByText('Juan')).toBeInTheDocument();
    expect(getByText('Pedro')).toBeInTheDocument();
    expect(getByText('Ana')).toBeInTheDocument();
    expect(getByText('3')).toBeInTheDocument();
    expect(getByText('2')).toBeInTheDocument();
    expect(getByText('1')).toBeInTheDocument();
  });

  it('should display goal counts correctly sorted', () => {
    mockUseGameStore.mockReturnValue({
      currentGoals: {
        'player1': 1,
        'player2': 3,
        'player3': 2,
      },
      activeTeams: mockTeamsWithPlayers,
    } as any);

    const { container } = render(<DailyScorersTable />);
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveTextContent('Pedro');
    expect(rows[0]).toHaveTextContent('3');
    expect(rows[1]).toHaveTextContent('Ana');
    expect(rows[1]).toHaveTextContent('2');
    expect(rows[2]).toHaveTextContent('Juan');
    expect(rows[2]).toHaveTextContent('1');
  });

  it('should handle empty goals', () => {
    mockUseGameStore.mockReturnValue({
      currentGoals: {},
      activeTeams: mockTeamsWithPlayers,
    } as any);

    const { getByText } = render(<DailyScorersTable />);
    
    expect(getByText('No hay goles registrados')).toBeInTheDocument();
  });

  it('should handle players not in teams', () => {
    mockUseGameStore.mockReturnValue({
      currentGoals: {
        'unknown-player': 2,
      },
      activeTeams: mockTeamsWithPlayers,
    } as any);

    const { getByText } = render(<DailyScorersTable />);
    
    expect(getByText('Jugador Desconocido')).toBeInTheDocument();
    expect(getByText('2')).toBeInTheDocument();
  });
}); 