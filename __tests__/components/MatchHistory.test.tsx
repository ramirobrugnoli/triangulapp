import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchHistory } from '@/components/game/MatchHistory';
import { MatchRecord } from '@/types';

// Mock the helpers module
jest.mock('@/lib/helpers/helpers', () => ({
  getColorByTeam: (team: string) => {
    const colorMap: { [key: string]: string } = {
      "Equipo 1": "Amarillo",
      "Equipo 2": "Rosa", 
      "Equipo 3": "Negro"
    };
    return colorMap[team] || team;
  }
}));

describe('MatchHistory', () => {
  const mockMatch: MatchRecord = {
    teamA: {
      name: "Equipo 1",
      members: [
        { id: "1", name: "Player 1" },
        { id: "2", name: "Player 2" }
      ],
      score: 2
    },
    teamB: {
      name: "Equipo 2", 
      members: [
        { id: "3", name: "Player 3" },
        { id: "4", name: "Player 4" }
      ],
      score: 1
    },
    waiting: {
      name: "Equipo 3",
      members: [
        { id: "5", name: "Player 5" },
        { id: "6", name: "Player 6" }
      ]
    },
    goals: {
      "1": 1,
      "2": 1,
      "3": 1
    },
    result: "A",
    timestamp: Date.now()
  };

  it('shows empty state when no matches', () => {
    render(<MatchHistory matches={[]} />);
    expect(screen.getByText('No hay partidos jugados aún')).toBeInTheDocument();
  });

  it('displays match information correctly', () => {
    render(<MatchHistory matches={[mockMatch]} />);
    
    // Check scores
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Check that some result text appears (might be "Ganó Amarillo" or just team names)
    expect(screen.getByText(/Ganó/)).toBeInTheDocument();
    
    // Check player names
    expect(screen.getByText('Player 1, Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3, Player 4')).toBeInTheDocument();
    
    // Check total goals
    expect(screen.getByText('Total goles: 3')).toBeInTheDocument();
    
    // Check goal scorers
    expect(screen.getByText('Player 1 (1), Player 2 (1), Player 3 (1)')).toBeInTheDocument();
  });

  it('displays draw match correctly', () => {
    const drawMatch = {
      ...mockMatch,
      teamA: { ...mockMatch.teamA, score: 1 },
      teamB: { ...mockMatch.teamB, score: 1 },
      result: "draw" as const
    };

    render(<MatchHistory matches={[drawMatch]} />);
    
    expect(screen.getByText('Empate')).toBeInTheDocument();
  });

  it('shows multiple matches with correct numbering', () => {
    const matches = [mockMatch, { ...mockMatch, timestamp: mockMatch.timestamp + 1000 }];
    
    render(<MatchHistory matches={matches} />);
    
    // Should show #1 and #2 (most recent first)
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('handles match with no goals', () => {
    const noGoalsMatch = {
      ...mockMatch,
      teamA: { ...mockMatch.teamA, score: 0 },
      teamB: { ...mockMatch.teamB, score: 0 },
      goals: {},
      result: "draw" as const
    };

    render(<MatchHistory matches={[noGoalsMatch]} />);
    
    expect(screen.getByText('Total goles: 0')).toBeInTheDocument();
    expect(screen.queryByText('Goleadores:')).not.toBeInTheDocument();
  });
}); 