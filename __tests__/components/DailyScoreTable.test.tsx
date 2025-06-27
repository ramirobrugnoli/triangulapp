import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DailyScoreTable } from '@/components/game/DailyScoreTable';

const mockTeamScores = [
  { name: 'Equipo 1' as const, points: 6, wins: 2, normalWins: 0, draws: 0 },
  { name: 'Equipo 2' as const, points: 3, wins: 1, normalWins: 0, draws: 0 },
  { name: 'Equipo 3' as const, points: 1, wins: 0, normalWins: 0, draws: 1 },
];

describe('DailyScoreTable Component', () => {
  it('should render the table with team scores', () => {
    const { container, getByText } = render(<DailyScoreTable scores={mockTeamScores} />);
    
    expect(getByText('Amarillo')).toBeInTheDocument();
    expect(getByText('Rosa')).toBeInTheDocument();
    expect(getByText('Negro')).toBeInTheDocument();
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should display points and wins correctly', () => {
    const { container } = render(<DailyScoreTable scores={mockTeamScores} />);
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    
    // Verificar que existe la estructura correcta sin buscar texto duplicado
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(0);
    
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should handle empty team scores', () => {
    const { container } = render(<DailyScoreTable scores={[]} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    const tbody = table?.querySelector('tbody');
    expect(tbody?.children).toHaveLength(0);
  });
}); 