import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayersCountSelector } from '@/app/graficos/components/PlayersCountSelector';
import { StatMetric } from '@/types/stats';

describe('PlayersCountSelector', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    metric: 'goals' as StatMetric,
    totalPlayers: 10,
    currentValue: 5,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct label and select', () => {
    render(<PlayersCountSelector {...defaultProps} />);
    
    expect(screen.getByText('Mostrar:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5 jugadores')).toBeInTheDocument();
  });

  it('generates correct options based on total players', () => {
    render(<PlayersCountSelector {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(9); // 3-10 players + "Todos"
    expect(options[0]).toHaveTextContent('3 jugadores');
    expect(options[7]).toHaveTextContent('10 jugadores');
    expect(options[8]).toHaveTextContent('Todos');
  });

  it('calls onChange when option is selected', () => {
    render(<PlayersCountSelector {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '7' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('goals', 7);
  });

  it('handles "Todos" option correctly', () => {
    render(<PlayersCountSelector {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('goals', 10);
  });

  it('handles minimum players when total is very low', () => {
    render(<PlayersCountSelector {...defaultProps} totalPlayers={2} />);
    
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    
    expect(options).toHaveLength(2); // Only one option (3) + "Todos"
    expect(options[0]).toHaveTextContent('3 jugadores');
    expect(options[1]).toHaveTextContent('Todos');
  });

  it('works with different stat metrics', () => {
    render(<PlayersCountSelector {...defaultProps} metric="wins" />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '6' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('wins', 6);
  });
}); 