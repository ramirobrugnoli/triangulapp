import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ToastContainer } from 'react-toastify';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
      <ToastContainer />
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

export const mockPlayer = {
  id: 'player-1',
  name: 'Test Player',
  stats: {
    matches: 10,
    goals: 5,
    wins: 7,
    draws: 2,
    losses: 1,
    points: 23,
    winPercentage: 70,
    triangularsPlayed: 5,
    triangularWins: 2,
    triangularSeconds: 2,
    triangularThirds: 1,
    triangularPoints: 15,
    triangularWinPercentage: 40,
  },
};

export const mockTriangular = {
  id: 'triangular-1',
  date: '2023-12-01T10:00:00Z',
  champion: 'Equipo 1',
  teams: [
    { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
    { name: 'Equipo 2', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
    { name: 'Equipo 3', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 },
  ],
  scorers: [
    { name: 'Test Player', goals: 3, team: 'Equipo 1' },
  ],
};

export const mockGameState = {
  activeTeams: {
    teamA: { name: 'Equipo 1', members: [{ id: 'player-1', name: 'Player 1' }] },
    teamB: { name: 'Equipo 2', members: [{ id: 'player-2', name: 'Player 2' }] },
    waiting: { name: 'Equipo 3', members: [{ id: 'player-3', name: 'Player 3' }] },
  },
  scores: { teamA: 0, teamB: 0 },
  dailyScores: [
    { name: 'Equipo 1', points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: 'Equipo 2', points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: 'Equipo 3', points: 0, wins: 0, normalWins: 0, draws: 0 },
  ],
  timer: { timeLeft: 420, MATCH_DURATION: 420, isRunning: false },
  isActive: false,
  teamBuilder: { available: [], team1: [], team2: [], team3: [] },
  currentGoals: {},
  currentMatchGoals: {},
  lastWinner: '',
  lastDraw: '',
  selectedPlayers: [],
  matchHistory: [],
};

export const createMockFetch = (mockResponse: any, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(mockResponse),
  });
};

export const flushPromises = () => new Promise(setImmediate); 