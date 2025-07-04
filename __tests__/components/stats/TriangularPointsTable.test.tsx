import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TriangularPointsTable } from '@/components/stats/TriangularPointsTable';
import { Player, TriangularHistory } from '@/types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Juan',
    stats: {
      matches: 10,
      goals: 15,
      wins: 7,
      draws: 2,
      losses: 1,
      points: 23,
    },
  },
  {
    id: '2',
    name: 'Pedro',
    stats: {
      matches: 8,
      goals: 12,
      wins: 5,
      draws: 1,
      losses: 2,
      points: 16,
    },
  },
];

const mockTriangularHistory: TriangularHistory[] = [
  {
    id: 't1',
    date: '2024-02-19',
    champion: 'Equipo 1',
    teams: [
      { name: 'Equipo 1', points: 5, position: 1, wins: 2, normalWins: 1, draws: 0 },
      { name: 'Equipo 2', points: 2, position: 2, wins: 1, normalWins: 0, draws: 1 },
      { name: 'Equipo 3', points: 1, position: 3, wins: 0, normalWins: 0, draws: 1 },
    ],
    scorers: [
      { name: 'Juan', goals: 3, team: 'Equipo 1' },
      { name: 'Pedro', goals: 2, team: 'Equipo 2' },
    ],
    teamPlayers: {
      'Equipo 1': [ { id: '1', name: 'Juan', team: 'Equipo 1' } ],
      'Equipo 2': [ { id: '2', name: 'Pedro', team: 'Equipo 2' } ],
      'Equipo 3': [],
    },
  },
];

describe('TriangularPointsTable Component', () => {
  it('should render without errors', () => {
    const { getByText } = render(
      <TriangularPointsTable players={mockPlayers} triangularHistory={mockTriangularHistory} />
    );
    expect(getByText('Tabla de Puntos por Triangular')).toBeInTheDocument();
  });

  it('should navigate to player stats page on player name click', () => {
    const { getAllByText } = render(
      <TriangularPointsTable players={mockPlayers} triangularHistory={mockTriangularHistory} />
    );
    const playerButtons = getAllByText('Juan');
    fireEvent.click(playerButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/estadisticas/individuales/1');
  });
}); 