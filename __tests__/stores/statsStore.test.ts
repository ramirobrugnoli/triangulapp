import { useStatsStore } from '@/store/statsStore';
import { api } from '@/lib/api';
import { Player, TriangularHistory } from '@/types';

jest.mock('@/lib/api');

const mockApi = api as jest.Mocked<typeof api>;

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Player 1',
    stats: {
      matches: 10,
      goals: 5,
      wins: 7,
      draws: 2,
      losses: 1,
      points: 23,
      winPercentage: 90,
      triangularsPlayed: 3,
      triangularWins: 1,
      triangularSeconds: 1,
      triangularThirds: 1,
      triangularPoints: 8,
      triangularWinPercentage: 33.33
    }
  },
  {
    id: '2', 
    name: 'Player 2',
    stats: {
      matches: 8,
      goals: 3,
      wins: 5,
      draws: 1,
      losses: 2,
      points: 16,
      winPercentage: 75,
      triangularsPlayed: 2,
      triangularWins: 0,
      triangularSeconds: 2,
      triangularThirds: 0,
      triangularPoints: 4,
      triangularWinPercentage: 0
    }
  }
];

const mockTriangularHistory: TriangularHistory[] = [
  {
    id: 'triangular-1',
    date: '2023-12-01T10:00:00Z',
    champion: 'Equipo 1',
    teams: [
      { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
      { name: 'Equipo 2', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
      { name: 'Equipo 3', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 }
    ],
    scorers: [
      { name: 'Player 1', goals: 3, team: 'Equipo 1' },
      { name: 'Player 2', goals: 1, team: 'Equipo 2' }
    ]
  },
  {
    id: 'triangular-2',
    date: '2023-12-02T15:30:00Z',
    champion: 'Equipo 2',
    teams: [
      { name: 'Equipo 2', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
      { name: 'Equipo 1', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
      { name: 'Equipo 3', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 }
    ],
    scorers: [
      { name: 'Player 2', goals: 2, team: 'Equipo 2' },
      { name: 'Player 1', goals: 1, team: 'Equipo 1' }
    ]
  }
];

describe('StatsStore', () => {
  beforeEach(() => {
    const store = useStatsStore.getState();
    // Reset store state
    useStatsStore.setState({
      players: [],
      triangularHistory: [],
      loading: false,
      error: null,
      highlightedPlayers: {
        goals: null,
        wins: null,
        normalWins: null,
        triangularPoints: null,
      },
      playersToShow: {
        goals: 15,
        wins: 15,
        normalWins: 15,
        triangularPoints: 15,
      },
      triangularPointsTable: [],
    });
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useStatsStore.getState();
      
      expect(store.players).toEqual([]);
      expect(store.triangularHistory).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.triangularPointsTable).toEqual([]);
    });
  });

  describe('Fetch Stats', () => {
    it('should fetch stats successfully', async () => {
      (mockApi.players.getAllPlayers as jest.Mock).mockResolvedValueOnce(mockPlayers);
      (mockApi.triangular.getTriangularHistory as jest.Mock).mockResolvedValueOnce(mockTriangularHistory);
      
      const store = useStatsStore.getState();
      
      await store.fetchStats();
      
      const updatedStore = useStatsStore.getState();
      expect(updatedStore.players).toEqual(mockPlayers);
      expect(updatedStore.triangularHistory).toEqual(mockTriangularHistory);
      expect(updatedStore.loading).toBe(false);
      expect(updatedStore.error).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (mockApi.players.getAllPlayers as jest.Mock).mockReturnValueOnce(promise);
      (mockApi.triangular.getTriangularHistory as jest.Mock).mockResolvedValueOnce(mockTriangularHistory);
      
      const store = useStatsStore.getState();
      
      const fetchPromise = store.fetchStats();
      
      // Check loading state
      expect(useStatsStore.getState().loading).toBe(true);
      
      resolvePromise!(mockPlayers);
      await fetchPromise;
      
      expect(useStatsStore.getState().loading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (mockApi.players.getAllPlayers as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      const store = useStatsStore.getState();
      
      await store.fetchStats();
      
      const updatedStore = useStatsStore.getState();
      expect(updatedStore.loading).toBe(false);
      expect(updatedStore.error).toBe('Error al cargar los datos. Por favor, intenta nuevamente.');
    });

    it('should not fetch if data already exists and not loading', async () => {
      // Set existing data
      useStatsStore.setState({
        players: mockPlayers,
        loading: false
      });
      
      const store = useStatsStore.getState();
      
      await store.fetchStats();
      
      expect(mockApi.players.getAllPlayers).not.toHaveBeenCalled();
      expect(mockApi.triangular.getTriangularHistory).not.toHaveBeenCalled();
    });
  });

  describe('Player Highlighting', () => {
    it('should handle player highlight correctly', () => {
      const store = useStatsStore.getState();
      
      store.handlePlayerHighlight('goals', 'Player 1');
      
      expect(useStatsStore.getState().highlightedPlayers.goals).toBe('Player 1');
    });

    it('should toggle player highlight off when same player selected', () => {
      const store = useStatsStore.getState();
      
      store.handlePlayerHighlight('goals', 'Player 1');
      store.handlePlayerHighlight('goals', 'Player 1');
      
      expect(useStatsStore.getState().highlightedPlayers.goals).toBeNull();
    });

    it('should switch highlight to different player', () => {
      const store = useStatsStore.getState();
      
      store.handlePlayerHighlight('wins', 'Player 1');
      store.handlePlayerHighlight('wins', 'Player 2');
      
      expect(useStatsStore.getState().highlightedPlayers.wins).toBe('Player 2');
    });
  });

  describe('Players to Show Configuration', () => {
    it('should update players to show count', () => {
      const store = useStatsStore.getState();
      
      store.handlePlayersToShowChange('goals', 10);
      
      expect(useStatsStore.getState().playersToShow.goals).toBe(10);
    });

    it('should update different metrics independently', () => {
      const store = useStatsStore.getState();
      
      store.handlePlayersToShowChange('goals', 5);
      store.handlePlayersToShowChange('wins', 8);
      store.handlePlayersToShowChange('triangularPoints', 12);
      
      const state = useStatsStore.getState();
      expect(state.playersToShow.goals).toBe(5);
      expect(state.playersToShow.wins).toBe(8);
      expect(state.playersToShow.triangularPoints).toBe(12);
      expect(state.playersToShow.normalWins).toBe(15); // unchanged
    });
  });

  describe('Triangular Points Table Calculation', () => {
    beforeEach(() => {
      useStatsStore.setState({
        players: mockPlayers,
        triangularHistory: mockTriangularHistory
      });
    });

    it('should calculate triangular points correctly', () => {
      const store = useStatsStore.getState();
      
      store.calculateTriangularPointsTable();
      
      const pointsTable = useStatsStore.getState().triangularPointsTable;
      
      expect(pointsTable).toHaveLength(2);
      
      // Player 1: 1st place (5 pts) + 2nd place (2 pts) = 7 pts
      const player1 = pointsTable.find(p => p.name === 'Player 1');
      expect(player1).toBeTruthy();
      expect(player1?.triangularWins).toBe(1);
      expect(player1?.triangularSeconds).toBe(1);
      expect(player1?.triangularThirds).toBe(0);
      expect(player1?.totalPoints).toBe(7);
      expect(player1?.triangularsPlayed).toBe(2);
      
      // Player 2: 1st place (5 pts) + 2nd place (2 pts) = 7 pts
      const player2 = pointsTable.find(p => p.name === 'Player 2');
      expect(player2).toBeTruthy();
      expect(player2?.triangularWins).toBe(1);
      expect(player2?.triangularSeconds).toBe(1);
      expect(player2?.triangularThirds).toBe(0);
      expect(player2?.totalPoints).toBe(7);
      expect(player2?.triangularsPlayed).toBe(2);
    });

    it('should sort players by total points descending', () => {
      // Create a scenario where one player has more points
      const modifiedHistory = [...mockTriangularHistory];
      modifiedHistory.push({
        id: 'triangular-3',
        date: '2023-12-03T15:30:00Z',
        champion: 'Equipo 1',
        teams: [
          { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
          { name: 'Equipo 2', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
          { name: 'Equipo 3', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 }
        ],
        scorers: [
          { name: 'Player 1', goals: 4, team: 'Equipo 1' }
        ]
      });
      
      useStatsStore.setState({
        triangularHistory: modifiedHistory
      });
      
      const store = useStatsStore.getState();
      store.calculateTriangularPointsTable();
      
      const pointsTable = useStatsStore.getState().triangularPointsTable;
      
      // Player 1 should be first with more points
      expect(pointsTable[0].name).toBe('Player 1');
      expect(pointsTable[0].totalPoints).toBeGreaterThan(pointsTable[1].totalPoints);
    });

    it('should filter out players with no triangular participation', () => {
      const playersWithNonParticipant = [
        ...mockPlayers,
        {
          id: '3',
          name: 'Player 3',
          stats: {
            matches: 0,
            goals: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            winPercentage: 0,
            triangularsPlayed: 0,
            triangularWins: 0,
            triangularSeconds: 0,
            triangularThirds: 0,
            triangularPoints: 0,
            triangularWinPercentage: 0
          }
        }
      ];
      
      useStatsStore.setState({
        players: playersWithNonParticipant
      });
      
      const store = useStatsStore.getState();
      store.calculateTriangularPointsTable();
      
      const pointsTable = useStatsStore.getState().triangularPointsTable;
      
      // Should only include players who participated
      expect(pointsTable).toHaveLength(2);
      expect(pointsTable.every(p => p.triangularsPlayed > 0)).toBe(true);
    });

    it('should handle empty data gracefully', () => {
      useStatsStore.setState({
        players: [],
        triangularHistory: []
      });
      
      const store = useStatsStore.getState();
      store.calculateTriangularPointsTable();
      
      const pointsTable = useStatsStore.getState().triangularPointsTable;
      expect(pointsTable).toEqual([]);
    });
  });
}); 