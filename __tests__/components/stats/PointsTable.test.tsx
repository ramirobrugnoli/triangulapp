import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PointsTable } from '@/components/stats/PointsTable';
import { Player } from '@/types';

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
      winPercentage: 70,
      triangularsPlayed: 3,
      triangularWins: 1,
      triangularSeconds: 1,
      triangularThirds: 1,
      triangularPoints: 8,
      triangularWinPercentage: 33.33,
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
      winPercentage: 62.5,
      triangularsPlayed: 2,
      triangularWins: 0,
      triangularSeconds: 1,
      triangularThirds: 1,
      triangularPoints: 3,
      triangularWinPercentage: 0,
    },
  },
  {
    id: '3',
    name: 'Ana',
    stats: {
      matches: 6,
      goals: 8,
      wins: 4,
      draws: 0,
      losses: 2,
      points: 12,
      winPercentage: 66.67,
      triangularsPlayed: 2,
      triangularWins: 0,
      triangularSeconds: 2,
      triangularThirds: 0,
      triangularPoints: 6,
      triangularWinPercentage: 0,
    },
  },
];

describe('PointsTable Component', () => {
  it('should render the component without errors', () => {
    const { container } = render(<PointsTable players={mockPlayers} />);
    
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBe(2); // Puntos y Goleadores
    
    const headings = container.querySelectorAll('h2');
    expect(headings.length).toBe(2);
  });

  it('should display all players in points table', () => {
    const { container } = render(<PointsTable players={mockPlayers} />);
    
    // Buscar en la primera tabla (puntos) específicamente
    const pointsTable = container.querySelectorAll('table')[0];
    const playerRows = pointsTable.querySelectorAll('tbody tr');
    expect(playerRows).toHaveLength(3);
    
    // Verificar que contiene los datos de los jugadores sin buscar texto duplicado
    const cells = pointsTable.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should display goals table', () => {
    const { container } = render(<PointsTable players={mockPlayers} />);
    
    // Buscar en la segunda tabla (goles) específicamente
    const goalsTable = container.querySelectorAll('table')[1];
    const playerRows = goalsTable.querySelectorAll('tbody tr');
    expect(playerRows).toHaveLength(3);
  });

  it('should display table headers correctly', () => {
    const { container } = render(<PointsTable players={mockPlayers} />);
    
    const pointsTableHeaders = container.querySelectorAll('table')[0].querySelectorAll('th');
    expect(pointsTableHeaders.length).toBe(5); // Jugador, TJ, PG, PE, Pts
    
    const goalsTableHeaders = container.querySelectorAll('table')[1].querySelectorAll('th');
    expect(goalsTableHeaders.length).toBe(3); // Jugador, Goles, Promedio
  });

  it('should handle empty players array', () => {
    const { container, getByText } = render(<PointsTable players={[]} />);
    
    // Con array vacío, el componente solo muestra la tabla de puntos con mensaje
    expect(getByText('Tabla de Puntos')).toBeInTheDocument();
    expect(getByText('No hay datos de jugadores disponibles')).toBeInTheDocument();
    
    const playerRows = container.querySelectorAll('tbody tr');
    expect(playerRows).toHaveLength(0);
  });

  it('should navigate to player stats page on player name click', () => {
    const { getAllByText } = render(<PointsTable players={mockPlayers} />);
    const playerButtons = getAllByText('Juan');
    fireEvent.click(playerButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/estadisticas/individuales/1');
  });
}); 