import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PodiumDisplay } from '@/app/graficos/components/PodiumDisplay';
import { Player } from '@/types';
import { StatMetric } from '@/types/stats';

describe('PodiumDisplay', () => {
  const mockOnPlayerSelect = jest.fn();
  
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player 1',
             stats: {
         goals: 15,
         wins: 8,
         normalWins: 5,
         points: 24,
         draws: 2,
         matches: 10,
         losses: 0,
         triangularsPlayed: 10,
         triangularWins: 3,
       },
    },
    {
      id: '2',
      name: 'Player 2',
             stats: {
         goals: 12,
         wins: 6,
         normalWins: 4,
         points: 18,
         draws: 3,
         matches: 8,
         losses: 0,
         triangularsPlayed: 8,
         triangularWins: 2,
       },
    },
    {
      id: '3',
      name: 'Player 3',
             stats: {
         goals: 10,
         wins: 4,
         normalWins: 3,
         points: 12,
         draws: 1,
         matches: 6,
         losses: 1,
         triangularsPlayed: 6,
         triangularWins: 1,
       },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when no players provided', () => {
    const { container } = render(
      <PodiumDisplay topThree={[]} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders single player podium correctly', () => {
    render(
      <PodiumDisplay topThree={[mockPlayers[0]]} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('1°')).toBeInTheDocument();
  });

  it('renders two players podium correctly', () => {
    render(
      <PodiumDisplay topThree={mockPlayers.slice(0, 2)} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('1°')).toBeInTheDocument();
    expect(screen.getByText('2°')).toBeInTheDocument();
  });

  it('renders full three players podium correctly', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('1°')).toBeInTheDocument();
    expect(screen.getByText('2°')).toBeInTheDocument();
    expect(screen.getByText('3°')).toBeInTheDocument();
  });

  it('calls onPlayerSelect when first place is clicked', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    const firstPlaceElement = screen.getByText('Player 1').closest('div');
    fireEvent.click(firstPlaceElement!);
    
    expect(mockOnPlayerSelect).toHaveBeenCalledWith('goals', 'Player 1');
  });

  it('calls onPlayerSelect when second place is clicked', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    const secondPlaceElement = screen.getByText('Player 2').closest('div');
    fireEvent.click(secondPlaceElement!);
    
    expect(mockOnPlayerSelect).toHaveBeenCalledWith('goals', 'Player 2');
  });

  it('calls onPlayerSelect when third place is clicked', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="goals" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    const thirdPlaceElement = screen.getByText('Player 3').closest('div');
    fireEvent.click(thirdPlaceElement!);
    
    expect(mockOnPlayerSelect).toHaveBeenCalledWith('goals', 'Player 3');
  });

  it('displays correct values for wins metric', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="wins" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays correct values for normalWins metric', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="normalWins" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays correct values for triangularPoints metric', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric="triangularPoints" onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('handles unknown metric gracefully', () => {
    render(
      <PodiumDisplay topThree={mockPlayers} metric={'unknown' as StatMetric} onPlayerSelect={mockOnPlayerSelect} />
    );
    
    expect(screen.getAllByText('0')).toHaveLength(3);
  });
}); 