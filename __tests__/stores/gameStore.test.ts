import { useGameStore } from '../../src/store/gameStore';
import { api } from '../../src/lib/api';
import { Team, TriangularResult, Player, MatchRecord } from '../../src/types';

jest.mock('../../src/lib/api');

const mockApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetAllScores();
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Score Management', () => {
    it('should update team A score', () => {
      const store = useGameStore.getState();
      
      store.updateScore('A', 2);
      
      expect(useGameStore.getState().scores.teamA).toBe(2);
      expect(useGameStore.getState().scores.teamB).toBe(0);
    });

    it('should update team B score', () => {
      const store = useGameStore.getState();
      
      store.updateScore('B', 1);
      
      expect(useGameStore.getState().scores.teamA).toBe(0);
      expect(useGameStore.getState().scores.teamB).toBe(1);
    });

    it('should validate and update score when valid', () => {
      const store = useGameStore.getState();
      
      store.validateAndUpdateScore('A', 1);
      
      expect(useGameStore.getState().scores.teamA).toBe(1);
    });

    it('should not update score when invalid (negative)', () => {
      const store = useGameStore.getState();
      
      store.validateAndUpdateScore('A', -1);
      
      expect(useGameStore.getState().scores.teamA).toBe(0);
    });

    it('should not update score when invalid (greater than 2)', () => {
      const store = useGameStore.getState();
      
      store.validateAndUpdateScore('A', 3);
      
      expect(useGameStore.getState().scores.teamA).toBe(0);
    });

    it('should reset scores', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateScore('B', 1);
      
      store.resetGame();
      
      expect(useGameStore.getState().scores.teamA).toBe(0);
      expect(useGameStore.getState().scores.teamB).toBe(0);
    });
  });

  describe('Team Rotation', () => {
    it('should rotate teams when team A wins', () => {
      const store = useGameStore.getState();
      const initialTeams = store.activeTeams;
      
      store.rotateTeams('A');
      const newState = useGameStore.getState();
      
      expect(newState.activeTeams.teamA).toEqual(initialTeams.teamA);
      expect(newState.activeTeams.teamB).toEqual(initialTeams.waiting);
      expect(newState.activeTeams.waiting).toEqual(initialTeams.teamB);
      expect(newState.lastWinner).toBe('A');
      expect(newState.lastDraw).toBe('');
    });

    it('should rotate teams when team B wins', () => {
      const store = useGameStore.getState();
      const initialTeams = store.activeTeams;
      
      store.rotateTeams('B');
      const newState = useGameStore.getState();
      
      expect(newState.activeTeams.teamA).toEqual(initialTeams.waiting);
      expect(newState.activeTeams.teamB).toEqual(initialTeams.teamB);
      expect(newState.activeTeams.waiting).toEqual(initialTeams.teamA);
      expect(newState.lastWinner).toBe('B');
      expect(newState.lastDraw).toBe('');
    });

    it('should handle draw when last winner was A', () => {
      const store = useGameStore.getState();
      store.rotateTeams('A');
      const teamsAfterAWin = useGameStore.getState().activeTeams;
      
      store.rotateTeams('draw');
      const newState = useGameStore.getState();
      
      expect(newState.activeTeams.teamA).toEqual(teamsAfterAWin.waiting);
      expect(newState.activeTeams.teamB).toEqual(teamsAfterAWin.teamB);
      expect(newState.activeTeams.waiting).toEqual(teamsAfterAWin.teamA);
      expect(newState.lastWinner).toBe('');
      expect(newState.lastDraw).toBe('B');
    });

    it('should handle draw when last winner was B', () => {
      const store = useGameStore.getState();
      store.rotateTeams('B');
      const teamsAfterBWin = useGameStore.getState().activeTeams;
      
      store.rotateTeams('draw');
      const newState = useGameStore.getState();
      
      expect(newState.activeTeams.teamA).toEqual(teamsAfterBWin.teamA);
      expect(newState.activeTeams.teamB).toEqual(teamsAfterBWin.waiting);
      expect(newState.activeTeams.waiting).toEqual(teamsAfterBWin.teamB);
      expect(newState.lastWinner).toBe('');
      expect(newState.lastDraw).toBe('A');
    });

    it('should handle first draw with deterministic rotation', () => {
      const store = useGameStore.getState();
      
      // Configurar estado inicial limpio (primer partido)
      useGameStore.setState({
        ...useGameStore.getState(),
        lastWinner: "",
        lastDraw: "",
        activeTeams: {
          teamA: { name: "Equipo 1", members: [] },
          teamB: { name: "Equipo 2", members: [] },
          waiting: { name: "Equipo 3", members: [] }
        },
      });
      
      // Mock Math.random para obtener resultado predecible
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.7); // > 0.5, elegirá segunda opción
      
      try {
        store.rotateTeams('draw');
        const newState = useGameStore.getState();
        
        expect(newState.lastWinner).toBe('');
        expect(newState.lastDraw).toBe('A'); // Segunda opción del random
        
      } finally {
        // Restaurar Math.random
        Math.random = originalRandom;
      }
    });

    it('should keep waiting team on field when match ends in draw', () => {
      const store = useGameStore.getState();
      
      // Configurar estado inicial con equipos específicos
      store.setTeams({
        teamA: { name: "Equipo 1", members: [] },
        teamB: { name: "Equipo 2", members: [] },
        waiting: { name: "Equipo 3", members: [] }
      });
      
      // Simular empate
      store.updateScore('A', 1);
      store.updateScore('B', 1);
      store.showMatchEndModal("draw");
      store.acceptMatchEnd();
      
      const finalState = useGameStore.getState();
      
      // En caso de empate, el equipo que estaba esperando (Equipo 3) 
      // debe quedar en cancha (como teamA o teamB)
      const teamNames = [finalState.activeTeams.teamA.name, finalState.activeTeams.teamB.name];
      expect(teamNames).toContain("Equipo 3");
    });

    it('should use Math.random for first draw when no previous game history', () => {
      const store = useGameStore.getState();
      
      // Configurar estado inicial limpio (primer partido)
      useGameStore.setState({
        ...useGameStore.getState(),
        lastWinner: "",
        lastDraw: "",
        activeTeams: {
          teamA: { name: "Equipo 1", members: [] },
          teamB: { name: "Equipo 2", members: [] },
          waiting: { name: "Equipo 3", members: [] }
        },
        matchEndModal: {
          isOpen: false,
          result: null,
        },
      });
      
      // Mock Math.random para obtener resultado predecible
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.3); // < 0.5, elegirá primera opción
      
      try {
        // Simular empate en primer partido
        store.rotateTeams("draw");
        
        const state = useGameStore.getState();
        
        // Verificar que se usó la primera opción del random
        // waiting (Equipo 3) como teamA, teamA original (Equipo 1) sale
        expect(state.activeTeams.teamA.name).toBe("Equipo 3");
        expect(state.activeTeams.teamB.name).toBe("Equipo 2");
        expect(state.activeTeams.waiting.name).toBe("Equipo 1");
        expect(state.lastDraw).toBe("B");
        
      } finally {
        // Restaurar Math.random
        Math.random = originalRandom;
      }
    });

    it('should prioritize team that did not play in previous match for draw rotation', () => {
      const store = useGameStore.getState();
      
      // Configurar estado donde A ganó el partido anterior
      useGameStore.setState({
        ...useGameStore.getState(),
        lastWinner: "A",
        lastDraw: "",
        activeTeams: {
          teamA: { name: "Equipo 2", members: [] }, // A había ganado
          teamB: { name: "Equipo 3", members: [] }, // waiting había entrado
          waiting: { name: "Equipo 1", members: [] } // el que había perdido
        },
        matchEndModal: {
          isOpen: false,
          result: null,
        },
      });
      
      // Simular empate en el partido actual
      store.rotateTeams("draw");
      
      const state = useGameStore.getState();
      
      // Como A había ganado antes, ahora A debe salir y waiting entra
      expect(state.activeTeams.teamA.name).toBe("Equipo 1"); // waiting entra como A
      expect(state.activeTeams.teamB.name).toBe("Equipo 3"); // B se queda
      expect(state.activeTeams.waiting.name).toBe("Equipo 2"); // A sale
      expect(state.lastDraw).toBe("B");
      expect(state.lastWinner).toBe("");
    });
  });

  describe('Draw Rotation Logic - All Scenarios', () => {
    beforeEach(() => {
      // Reset completo antes de cada test
      useGameStore.setState({
        ...useGameStore.getState(),
        lastWinner: "",
        lastDraw: "",
        activeTeams: {
          teamA: { name: "Equipo 1", members: [] },
          teamB: { name: "Equipo 2", members: [] },
          waiting: { name: "Equipo 3", members: [] }
        },
        matchEndModal: {
          isOpen: false,
          result: null,
        },
      });
    });

    describe('First match (no previous history)', () => {
      it('should use Math.random when no previous game history - random < 0.5', () => {
        const store = useGameStore.getState();
        
        // Mock Math.random para obtener valor < 0.5
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.3);
        
        try {
          store.rotateTeams("draw");
          const state = useGameStore.getState();
          
          // Primera opción: waiting como teamA, teamA original sale
          expect(state.activeTeams.teamA.name).toBe("Equipo 3"); // waiting entra como A
          expect(state.activeTeams.teamB.name).toBe("Equipo 2"); // B se queda
          expect(state.activeTeams.waiting.name).toBe("Equipo 1"); // A sale
          expect(state.lastDraw).toBe("B"); // B se queda marcado
          expect(state.lastWinner).toBe("");
        } finally {
          Math.random = originalRandom;
        }
      });

      it('should use Math.random when no previous game history - random >= 0.5', () => {
        const store = useGameStore.getState();
        
        // Mock Math.random para obtener valor >= 0.5
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.7);
        
        try {
          store.rotateTeams("draw");
          const state = useGameStore.getState();
          
          // Segunda opción: waiting como teamB, teamB original sale
          expect(state.activeTeams.teamA.name).toBe("Equipo 1"); // A se queda
          expect(state.activeTeams.teamB.name).toBe("Equipo 3"); // waiting entra como B
          expect(state.activeTeams.waiting.name).toBe("Equipo 2"); // B sale
          expect(state.lastDraw).toBe("A"); // A se queda marcado
          expect(state.lastWinner).toBe("");
        } finally {
          Math.random = originalRandom;
        }
      });
    });

    describe('After previous win scenarios', () => {
      it('should rotate correctly when previous winner was A', () => {
        const store = useGameStore.getState();
        
        // Configurar: A ganó el partido anterior
        useGameStore.setState({
          ...useGameStore.getState(),
          lastWinner: "A",
          lastDraw: "",
          activeTeams: {
            teamA: { name: "Equipo 1", members: [] }, // A que había ganado
            teamB: { name: "Equipo 3", members: [] }, // waiting había entrado
            waiting: { name: "Equipo 2", members: [] } // B que había perdido
          },
        });
        
        store.rotateTeams("draw");
        const state = useGameStore.getState();
        
        // A había ganado, ahora empata → A sale, waiting (Equipo 2) entra
        expect(state.activeTeams.teamA.name).toBe("Equipo 2"); // waiting entra como A
        expect(state.activeTeams.teamB.name).toBe("Equipo 3"); // B se queda
        expect(state.activeTeams.waiting.name).toBe("Equipo 1"); // A sale
        expect(state.lastDraw).toBe("B");
        expect(state.lastWinner).toBe("");
      });

      it('should rotate correctly when previous winner was B', () => {
        const store = useGameStore.getState();
        
        // Configurar: B ganó el partido anterior
        useGameStore.setState({
          ...useGameStore.getState(),
          lastWinner: "B",
          lastDraw: "",
          activeTeams: {
            teamA: { name: "Equipo 3", members: [] }, // waiting había entrado
            teamB: { name: "Equipo 2", members: [] }, // B que había ganado
            waiting: { name: "Equipo 1", members: [] } // A que había perdido
          },
        });
        
        store.rotateTeams("draw");
        const state = useGameStore.getState();
        
        // B había ganado, ahora empata → B sale, waiting (Equipo 1) entra
        expect(state.activeTeams.teamA.name).toBe("Equipo 3"); // A se queda
        expect(state.activeTeams.teamB.name).toBe("Equipo 1"); // waiting entra como B
        expect(state.activeTeams.waiting.name).toBe("Equipo 2"); // B sale
        expect(state.lastDraw).toBe("A");
        expect(state.lastWinner).toBe("");
      });
    });

    describe('After previous draw scenarios', () => {
      it('should rotate correctly when previous draw had A marked as staying', () => {
        const store = useGameStore.getState();
        
        // Configurar: empate anterior donde A se había quedado
        useGameStore.setState({
          ...useGameStore.getState(),
          lastWinner: "",
          lastDraw: "A",
          activeTeams: {
            teamA: { name: "Equipo 1", members: [] }, // A que se había quedado
            teamB: { name: "Equipo 3", members: [] }, // waiting había entrado
            waiting: { name: "Equipo 2", members: [] } // B que había salido
          },
        });
        
        store.rotateTeams("draw");
        const state = useGameStore.getState();
        
        // A se había quedado en empate anterior, ahora vuelve a empatar → A sale
        expect(state.activeTeams.teamA.name).toBe("Equipo 2"); // waiting entra como A
        expect(state.activeTeams.teamB.name).toBe("Equipo 3"); // B se queda
        expect(state.activeTeams.waiting.name).toBe("Equipo 1"); // A sale
        expect(state.lastDraw).toBe("B");
        expect(state.lastWinner).toBe("");
      });

      it('should rotate correctly when previous draw had B marked as staying', () => {
        const store = useGameStore.getState();
        
        // Configurar: empate anterior donde B se había quedado
        useGameStore.setState({
          ...useGameStore.getState(),
          lastWinner: "",
          lastDraw: "B",
          activeTeams: {
            teamA: { name: "Equipo 3", members: [] }, // waiting había entrado
            teamB: { name: "Equipo 2", members: [] }, // B que se había quedado
            waiting: { name: "Equipo 1", members: [] } // A que había salido
          },
        });
        
        store.rotateTeams("draw");
        const state = useGameStore.getState();
        
        // B se había quedado en empate anterior, ahora vuelve a empatar → B sale
        expect(state.activeTeams.teamA.name).toBe("Equipo 3"); // A se queda
        expect(state.activeTeams.teamB.name).toBe("Equipo 1"); // waiting entra como B
        expect(state.activeTeams.waiting.name).toBe("Equipo 2"); // B sale
        expect(state.lastDraw).toBe("A");
        expect(state.lastWinner).toBe("");
      });
    });

    describe('Complex sequences', () => {
      it('should handle sequence: A wins → draw → B wins → draw', () => {
        const store = useGameStore.getState();
        
        // Partido 1: A gana
        store.rotateTeams("A");
        let state = useGameStore.getState();
        expect(state.lastWinner).toBe("A");
        expect(state.lastDraw).toBe("");
        
        // Configurar equipos después de victoria de A
        const teamsAfterAWin = {
          teamA: { name: "Equipo 1" as Team, members: [] }, // A se queda
          teamB: { name: "Equipo 3" as Team, members: [] }, // waiting entra
          waiting: { name: "Equipo 2" as Team, members: [] } // B sale
        };
        useGameStore.setState({
          ...state,
          activeTeams: teamsAfterAWin
        });
        
        // Partido 2: Empate (A había ganado antes)
        store.rotateTeams("draw");
        state = useGameStore.getState();
        expect(state.lastWinner).toBe("");
        expect(state.lastDraw).toBe("B"); // B se queda
        expect(state.activeTeams.teamA.name).toBe("Equipo 2"); // waiting entra
        expect(state.activeTeams.teamB.name).toBe("Equipo 3"); // B se queda
        expect(state.activeTeams.waiting.name).toBe("Equipo 1"); // A sale
        
        // Partido 3: B gana
        store.rotateTeams("B");
        state = useGameStore.getState();
        expect(state.lastWinner).toBe("B");
        expect(state.lastDraw).toBe("");
        
        // Configurar equipos después de victoria de B
        const teamsAfterBWin = {
          teamA: { name: "Equipo 1" as Team, members: [] }, // waiting había entrado
          teamB: { name: "Equipo 3" as Team, members: [] }, // B se queda
          waiting: { name: "Equipo 2" as Team, members: [] } // A sale
        };
        useGameStore.setState({
          ...state,
          activeTeams: teamsAfterBWin
        });
        
        // Partido 4: Empate (B había ganado antes)
        store.rotateTeams("draw");
        state = useGameStore.getState();
        expect(state.lastWinner).toBe("");
        expect(state.lastDraw).toBe("A"); // A se queda
        expect(state.activeTeams.teamA.name).toBe("Equipo 1"); // A se queda
        expect(state.activeTeams.teamB.name).toBe("Equipo 2"); // waiting entra
        expect(state.activeTeams.waiting.name).toBe("Equipo 3"); // B sale
      });

      it('should handle sequence: draw → draw → draw (multiple consecutive draws)', () => {
        const store = useGameStore.getState();
        
        // Mock Math.random para primer empate
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 0.3); // < 0.5
        
        try {
          // Partido 1: Primer empate
          store.rotateTeams("draw");
          let state = useGameStore.getState();
          expect(state.lastDraw).toBe("B");
          expect(state.activeTeams.teamA.name).toBe("Equipo 3"); // waiting entra
          expect(state.activeTeams.teamB.name).toBe("Equipo 2"); // B se queda
          expect(state.activeTeams.waiting.name).toBe("Equipo 1"); // A sale
          
          // Partido 2: Segundo empate (B se había quedado)
          store.rotateTeams("draw");
          state = useGameStore.getState();
          expect(state.lastDraw).toBe("A");
          expect(state.activeTeams.teamA.name).toBe("Equipo 3"); // A se queda
          expect(state.activeTeams.teamB.name).toBe("Equipo 1"); // waiting entra
          expect(state.activeTeams.waiting.name).toBe("Equipo 2"); // B sale
          
          // Partido 3: Tercer empate (A se había quedado)
          store.rotateTeams("draw");
          state = useGameStore.getState();
          expect(state.lastDraw).toBe("B");
          expect(state.activeTeams.teamA.name).toBe("Equipo 2"); // waiting entra
          expect(state.activeTeams.teamB.name).toBe("Equipo 1"); // B se queda
          expect(state.activeTeams.waiting.name).toBe("Equipo 3"); // A sale
          
        } finally {
          Math.random = originalRandom;
        }
      });
    });

    describe('Edge cases', () => {
      it('should maintain team rotation consistency with waiting team always getting priority', () => {
        const store = useGameStore.getState();
        
        // Verificar que en cualquier escenario de empate, el waiting siempre entra
        const scenarios = [
          { lastWinner: "A", lastDraw: "", description: "after A win" },
          { lastWinner: "B", lastDraw: "", description: "after B win" },
          { lastWinner: "", lastDraw: "A", description: "after draw with A staying" },
          { lastWinner: "", lastDraw: "B", description: "after draw with B staying" }
        ];
        
        scenarios.forEach(scenario => {
                     // Reset y configurar escenario
           useGameStore.setState({
             ...useGameStore.getState(),
             lastWinner: scenario.lastWinner,
             lastDraw: scenario.lastDraw,
             activeTeams: {
               teamA: { name: "Equipo 1" as Team, members: [] },
               teamB: { name: "Equipo 2" as Team, members: [] },
               waiting: { name: "Equipo 3" as Team, members: [] }
             },
           });
           
           store.rotateTeams("draw");
           const state = useGameStore.getState();
           
           // El waiting team siempre debe estar en cancha después del empate
           const teamNames = [state.activeTeams.teamA.name, state.activeTeams.teamB.name];
           expect(teamNames).toContain("Equipo 3");
           expect(state.activeTeams.waiting.name).not.toBe("Equipo 3");
          expect(state.lastWinner).toBe("");
          expect(["A", "B"]).toContain(state.lastDraw);
        });
      });

      it('should handle rapid alternating wins and draws correctly', () => {
        const store = useGameStore.getState();
        
                 // Secuencia: A gana → empate → A gana → empate → B gana → empate
         const moves = ["A", "draw", "A", "draw", "B", "draw"];
         const results: Array<{
           move: string;
           lastWinner: string;
           lastDraw: string;
           teams: { A: string; B: string; waiting: string; };
         }> = [];
        
        moves.forEach((move, index) => {
          if (move === "draw") {
            // Mock Math.random solo para primer empate
            const originalRandom = Math.random;
            if (index === 1) { // primer empate
              Math.random = jest.fn(() => 0.4);
            }
            
            try {
              store.rotateTeams(move as "A" | "B" | "draw");
              const state = useGameStore.getState();
              results.push({
                move,
                lastWinner: state.lastWinner,
                lastDraw: state.lastDraw,
                teams: {
                  A: state.activeTeams.teamA.name,
                  B: state.activeTeams.teamB.name,
                  waiting: state.activeTeams.waiting.name
                }
              });
            } finally {
              Math.random = originalRandom;
            }
          } else {
            store.rotateTeams(move as "A" | "B" | "draw");
            const state = useGameStore.getState();
            results.push({
              move,
              lastWinner: state.lastWinner,
              lastDraw: state.lastDraw,
              teams: {
                A: state.activeTeams.teamA.name,
                B: state.activeTeams.teamB.name,
                waiting: state.activeTeams.waiting.name
              }
            });
          }
        });
        
        // Verificar que cada empate tiene el waiting team en cancha
        results.forEach((result, index) => {
          if (result.move === "draw") {
            const teamNames = [result.teams.A, result.teams.B];
            expect(teamNames).toContain("Equipo 3"); // waiting team original name
            expect(result.lastWinner).toBe("");
            expect(["A", "B"]).toContain(result.lastDraw);
          }
        });
      });
    });
  });

  describe('Daily Score Management', () => {
    it('should update daily score for win', () => {
      const store = useGameStore.getState();
      
      store.updateDailyScore('Equipo 1', 'win');
      const teamStats = store.getTeamStats('Equipo 1');
      
      expect(teamStats?.points).toBe(3);
      expect(teamStats?.wins).toBe(1);
      expect(teamStats?.normalWins).toBe(0);
      expect(teamStats?.draws).toBe(0);
    });

    it('should update daily score for normal win', () => {
      const store = useGameStore.getState();
      
      store.updateDailyScore('Equipo 1', 'normalWin');
      const teamStats = store.getTeamStats('Equipo 1');
      
      expect(teamStats?.points).toBe(2);
      expect(teamStats?.wins).toBe(0);
      expect(teamStats?.normalWins).toBe(1);
      expect(teamStats?.draws).toBe(0);
    });

    it('should update daily score for draw', () => {
      const store = useGameStore.getState();
      
      store.updateDailyScore('Equipo 1', 'draw');
      const teamStats = store.getTeamStats('Equipo 1');
      
      expect(teamStats?.points).toBe(1);
      expect(teamStats?.wins).toBe(0);
      expect(teamStats?.normalWins).toBe(0);
      expect(teamStats?.draws).toBe(1);
    });

    it('should get total matches for team', () => {
      const store = useGameStore.getState();
      store.updateDailyScore('Equipo 1', 'win');
      store.updateDailyScore('Equipo 1', 'normalWin');
      store.updateDailyScore('Equipo 1', 'draw');
      
      const totalMatches = store.getTotalMatches('Equipo 1');
      
      expect(totalMatches).toBe(3);
    });

    it('should calculate win percentage', () => {
      const store = useGameStore.getState();
      store.updateDailyScore('Equipo 1', 'win');
      store.updateDailyScore('Equipo 1', 'normalWin');
      store.updateDailyScore('Equipo 1', 'draw');
      
      const winPercentage = store.getWinPercentage('Equipo 1');
      
      expect(winPercentage).toBeCloseTo(66.67, 1);
    });

    it('should return 0 win percentage for team with no matches', () => {
      const store = useGameStore.getState();
      
      const winPercentage = store.getWinPercentage('Equipo 1');
      
      expect(winPercentage).toBe(0);
    });

    it('should validate team names', () => {
      const store = useGameStore.getState();
      
      expect(store.isValidTeam('Equipo 1')).toBe(true);
      expect(store.isValidTeam('Equipo 2')).toBe(true);
      expect(store.isValidTeam('Equipo 3')).toBe(true);
      expect(store.isValidTeam('Invalid Team')).toBe(false);
    });
  });

  describe('Timer Management', () => {
    it('should set time left', () => {
      const store = useGameStore.getState();
      
      store.setTimeLeft(300);
      
      expect(useGameStore.getState().timer.timeLeft).toBe(300);
    });

    it('should reset timer', () => {
      const store = useGameStore.getState();
      store.setTimeLeft(100);
      store.startTimer();
      
      store.resetTimer();
      const state = useGameStore.getState();
      
      expect(state.timer.timeLeft).toBe(420); // MATCH_DURATION
      expect(state.timer.isRunning).toBe(false);
    });

    it('should decrement timer', () => {
      const store = useGameStore.getState();
      store.setTimeLeft(100);
      
      store.decrementTimer();
      
      expect(useGameStore.getState().timer.timeLeft).toBe(99);
    });

    it('should not decrement timer below 0', () => {
      const store = useGameStore.getState();
      store.setTimeLeft(0);
      
      store.decrementTimer();
      
      expect(useGameStore.getState().timer.timeLeft).toBe(0);
    });

    it('should start timer', () => {
      const store = useGameStore.getState();
      
      store.startTimer();
      
      expect(useGameStore.getState().timer.isRunning).toBe(true);
    });

    it('should stop timer', () => {
      const store = useGameStore.getState();
      store.startTimer();
      
      store.stopTimer();
      
      expect(useGameStore.getState().timer.isRunning).toBe(false);
    });

    it('should get time left', () => {
      const store = useGameStore.getState();
      store.setTimeLeft(250);
      
      const timeLeft = store.getTimeLeft();
      
      expect(timeLeft).toBe(250);
    });

    it('should set active state and start timer', () => {
      const store = useGameStore.getState();
      
      store.setIsActive(true);
      
      expect(useGameStore.getState().isActive).toBe(true);
      expect(useGameStore.getState().timer.isRunning).toBe(true);
    });

    it('should set inactive state and stop timer', () => {
      const store = useGameStore.getState();
      store.setIsActive(true);
      
      store.setIsActive(false);
      
      expect(useGameStore.getState().isActive).toBe(false);
      expect(useGameStore.getState().timer.isRunning).toBe(false);
    });

    it('should reset timer when match ends in draw', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 1);
      store.updateScore('B', 1);
      store.setTimeLeft(100); // Set timer to some value other than default
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp(); // This shows modal for draw
      store.acceptMatchEnd(); // This resets the timer
      
      const state = useGameStore.getState();
      expect(state.timer.timeLeft).toBe(420); // Should be reset to MATCH_DURATION
      expect(state.timer.isRunning).toBe(false);
    });
  });

  describe('Victory Points Logic', () => {
    beforeEach(() => {
      useGameStore.setState({
        scores: { teamA: 0, teamB: 0 },
        dailyScores: [
          { name: "Equipo 1", points: 0, wins: 0, normalWins: 0, draws: 0 },
          { name: "Equipo 2", points: 0, wins: 0, normalWins: 0, draws: 0 },
          { name: "Equipo 3", points: 0, wins: 0, normalWins: 0, draws: 0 },
        ],
        activeTeams: {
          teamA: { name: "Equipo 1", members: [] },
          teamB: { name: "Equipo 2", members: [] },
          waiting: { name: "Equipo 3", members: [] },
        },
        matchEndModal: {
          isOpen: false,
          result: null,
        },
      });
    });

    it('should give 2 points for 2-1 victory (normalWin)', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateScore('B', 1);
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp();
      store.acceptMatchEnd();
      
      const state = useGameStore.getState();
      const teamAStats = state.dailyScores.find(s => s.name === "Equipo 1");
      expect(teamAStats?.points).toBe(2); // normalWin = 2 points
      expect(teamAStats?.normalWins).toBe(1);
      expect(teamAStats?.wins).toBe(0);
    });

    it('should give 3 points for 2-0 victory (win)', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateScore('B', 0);
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp();
      store.acceptMatchEnd();
      
      const state = useGameStore.getState();
      const teamAStats = state.dailyScores.find(s => s.name === "Equipo 1");
      expect(teamAStats?.points).toBe(3); // win = 3 points
      expect(teamAStats?.wins).toBe(1);
      expect(teamAStats?.normalWins).toBe(0);
    });

    it('should give 2 points for 1-0 victory by time (normalWin)', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 1);
      store.updateScore('B', 0);
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp();
      store.acceptMatchEnd();
      
      const state = useGameStore.getState();
      const teamAStats = state.dailyScores.find(s => s.name === "Equipo 1");
      expect(teamAStats?.points).toBe(2); // normalWin = 2 points (difference = 1)
      expect(teamAStats?.normalWins).toBe(1);
      expect(teamAStats?.wins).toBe(0);
    });

    it('should give 1 point each for draw', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 1);
      store.updateScore('B', 1);
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp();
      store.acceptMatchEnd();
      
      const state = useGameStore.getState();
      const teamAStats = state.dailyScores.find(s => s.name === "Equipo 1");
      const teamBStats = state.dailyScores.find(s => s.name === "Equipo 2");
      
      expect(teamAStats?.points).toBe(1); // draw = 1 point
      expect(teamAStats?.draws).toBe(1);
      expect(teamBStats?.points).toBe(1); // draw = 1 point
      expect(teamBStats?.draws).toBe(1);
    });

    it('should give 1 point each for 0-0 draw', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 0);
      store.updateScore('B', 0);
      
      // Simular el flujo completo: handleTimeUp -> modal -> acceptMatchEnd
      store.handleTimeUp();
      store.acceptMatchEnd();
      
      const state = useGameStore.getState();
      const teamAStats = state.dailyScores.find(s => s.name === "Equipo 1");
      const teamBStats = state.dailyScores.find(s => s.name === "Equipo 2");
      
      expect(teamAStats?.points).toBe(1); // draw = 1 point
      expect(teamAStats?.draws).toBe(1);
      expect(teamBStats?.points).toBe(1); // draw = 1 point
      expect(teamBStats?.draws).toBe(1);
    });

    it('should show modal when match ends', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateScore('B', 1);
      
      store.handleTimeUp();
      
      const state = useGameStore.getState();
      expect(state.matchEndModal.isOpen).toBe(true);
      expect(state.matchEndModal.result).toBe("A");
    });

    it('should close modal when accepting match end', () => {
      const store = useGameStore.getState();
      store.showMatchEndModal("A");
      
      expect(useGameStore.getState().matchEndModal.isOpen).toBe(true);
      
      store.acceptMatchEnd();
      
      expect(useGameStore.getState().matchEndModal.isOpen).toBe(false);
    });

    it('should reset game state after accepting match end', () => {
      const store = useGameStore.getState();
      
      // Configurar un estado de partido en progreso
      store.updateScore('A', 2);
      store.updateScore('B', 1);
      store.setIsActive(true);
      store.registerGoal('player1');
      store.setTimeLeft(300);
      
      // Verificar que el estado está configurado
      expect(useGameStore.getState().scores.teamA).toBe(2);
      expect(useGameStore.getState().scores.teamB).toBe(1);
      expect(useGameStore.getState().isActive).toBe(true);
      expect(useGameStore.getState().currentMatchGoals['player1']).toBe(1);
      expect(useGameStore.getState().timer.timeLeft).toBe(300);
      
      // Simular fin de partido y aceptar modal
      store.showMatchEndModal("A");
      store.acceptMatchEnd();
      
      const finalState = useGameStore.getState();
      
      // Verificar que el juego se resetea correctamente
      expect(finalState.scores.teamA).toBe(0);
      expect(finalState.scores.teamB).toBe(0);
      expect(finalState.isActive).toBe(false);
      expect(finalState.currentMatchGoals).toEqual({});
      expect(finalState.timer.timeLeft).toBe(420); // MATCH_DURATION
      expect(finalState.timer.isRunning).toBe(false);
      expect(finalState.timer.whistleHasPlayed).toBe(false);
      expect(finalState.matchEndModal.isOpen).toBe(false);
    });

    it('should call socket reset function when resetting game', () => {
      const store = useGameStore.getState();
      const mockSocketReset = jest.fn();
      
      // Configurar función socket
      store.setSocketResetFunction(mockSocketReset);
      
      // Resetear juego
      store.resetGame();
      
      // Verificar que se llamó la función socket
      expect(mockSocketReset).toHaveBeenCalledTimes(1);
    });

    it('should not crash when no socket reset function is set', () => {
      const store = useGameStore.getState();
      
      // Asegurarse de que no hay función socket
      store.setSocketResetFunction(null);
      
      // Resetear juego debería funcionar sin problemas
      expect(() => {
        store.resetGame();
      }).not.toThrow();
    });
  });

  describe('Goal Management', () => {
    it('should register goal for player', () => {
      const store = useGameStore.getState();
      
      store.registerGoal('player1');
      const state = useGameStore.getState();
      
      expect(state.currentGoals['player1']).toBe(1);
      expect(state.currentMatchGoals['player1']).toBe(1);
    });

    it('should register multiple goals for same player', () => {
      const store = useGameStore.getState();
      
      store.registerGoal('player1');
      store.registerGoal('player1');
      const state = useGameStore.getState();
      
      expect(state.currentGoals['player1']).toBe(2);
      expect(state.currentMatchGoals['player1']).toBe(2);
    });

    it('should get current match goals for team A', () => {
      const store = useGameStore.getState();
      
      // Setup team A with players
      store.setTeams({
        teamA: { name: 'Equipo 1', members: [{ id: 'player1', name: 'Player 1' }] },
        teamB: { name: 'Equipo 2', members: [{ id: 'player2', name: 'Player 2' }] },
        waiting: { name: 'Equipo 3', members: [] },
      });
      
      store.registerGoal('player1');
      store.registerGoal('player1');
      
      const teamAGoals = store.getCurrentMatchGoals('A');
      expect(teamAGoals).toBe(2);
    });

    it('should get current match goals for team B', () => {
      const store = useGameStore.getState();
      
      // Setup team B with players
      store.setTeams({
        teamA: { name: 'Equipo 1', members: [] },
        teamB: { name: 'Equipo 2', members: [{ id: 'player2', name: 'Player 2' }] },
        waiting: { name: 'Equipo 3', members: [] },
      });
      
      store.registerGoal('player2');
      
      const teamBGoals = store.getCurrentMatchGoals('B');
      expect(teamBGoals).toBe(1);
    });
  });

  describe('Team Assignment', () => {
    it('should update team players', () => {
      const store = useGameStore.getState();
      const mockPlayers: Player[] = [
        { id: '1', name: 'Player 1', stats: { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, points: 0 } },
        { id: '2', name: 'Player 2', stats: { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, points: 0 } },
        { id: '3', name: 'Player 3', stats: { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, points: 0 } },
      ];
      
      store.updateTeamPlayers({
        available: [],
        team1: [mockPlayers[0]],
        team2: [mockPlayers[1]],
        team3: [mockPlayers[2]],
      });
      
      const state = useGameStore.getState();
      
      expect(state.teamBuilder.team1[0].name).toBe('Player 1');
      expect(state.teamBuilder.team2[0].name).toBe('Player 2');
      expect(state.teamBuilder.team3[0].name).toBe('Player 3');
    });

    it('should set teams directly', () => {
      const store = useGameStore.getState();
      const newTeams = {
        teamA: { name: 'Equipo 1' as Team, members: [{ id: '1', name: 'Player 1' }] },
        teamB: { name: 'Equipo 2' as Team, members: [{ id: '2', name: 'Player 2' }] },
        waiting: { name: 'Equipo 3' as Team, members: [{ id: '3', name: 'Player 3' }] },
      };
      
      store.setTeams(newTeams);
      const state = useGameStore.getState();
      
      expect(state.activeTeams).toEqual(newTeams);
    });

    it('should update available players', () => {
      const store = useGameStore.getState();
      const mockPlayers: Player[] = [
        { id: '1', name: 'Player 1', stats: { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, points: 0 } },
        { id: '2', name: 'Player 2', stats: { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, points: 0 } },
      ];
      
      store.updateAvailablePlayers(mockPlayers);
      const state = useGameStore.getState();
      
      expect(state.selectedPlayers).toEqual(mockPlayers);
      expect(state.teamBuilder.available).toEqual(mockPlayers);
      expect(state.teamBuilder.team1).toEqual([]);
      expect(state.teamBuilder.team2).toEqual([]);
      expect(state.teamBuilder.team3).toEqual([]);
    });
  });

  describe('Match History', () => {
    it('should save match to history', () => {
      const state = useGameStore.getState();
      
      // Set up a match scenario
      state.updateScore('A', 2);
      state.updateScore('B', 1);
      
      state.saveMatchToHistory('A');
      
      const history = state.getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].result).toBe('A');
      expect(history[0].teamA.score).toBe(2);
      expect(history[0].teamB.score).toBe(1);
    });

    it('should get last match', () => {
      const state = useGameStore.getState();
      
      state.saveMatchToHistory('A');
      
      const lastMatch = state.getLastMatch();
      expect(lastMatch).not.toBeNull();
      expect(lastMatch!.result).toBe('A');
    });

    it('should return null when no matches in history', () => {
      const state = useGameStore.getState();
      const lastMatch = state.getLastMatch();
      expect(lastMatch).toBeNull();
    });

    it('should edit last match and update scores', () => {
      const state = useGameStore.getState();
      
      // Save initial match
      state.updateScore('A', 2);
      state.updateScore('B', 0);
      state.updateDailyScore('Equipo 1', 'win');
      state.saveMatchToHistory('A');
      
      const lastMatch = state.getLastMatch()!;
      const editedMatch = {
        ...lastMatch,
        teamA: { ...lastMatch.teamA, score: 1 },
        teamB: { ...lastMatch.teamB, score: 1 },
        result: 'draw' as const
      };
      
      state.editLastMatch(editedMatch);
      
      const updatedMatch = state.getLastMatch();
      expect(updatedMatch!.result).toBe('draw');
      expect(updatedMatch!.teamA.score).toBe(1);
      expect(updatedMatch!.teamB.score).toBe(1);
    });

    it('should save draw matches to history when accepting match end modal', () => {
      const state = useGameStore.getState();
      
      // Set up a draw scenario (scores 1-1)
      state.updateScore('A', 1);
      state.updateScore('B', 1);
      
      // Show modal for draw (simulates time running out)
      state.showMatchEndModal('draw');
      
      // Get updated state after showing modal
      const updatedState = useGameStore.getState();
      expect(updatedState.matchEndModal.isOpen).toBe(true);
      expect(updatedState.matchEndModal.result).toBe('draw');
      
      // Initially no matches in history
      expect(updatedState.getMatchHistory()).toHaveLength(0);
      
      // Accept the match end (should save to history)
      updatedState.acceptMatchEnd();
      
      // Get final state after accepting match end
      const finalState = useGameStore.getState();
      
      // Verify the draw match was saved to history
      const history = finalState.getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].result).toBe('draw');
      expect(history[0].teamA.score).toBe(1);
      expect(history[0].teamB.score).toBe(1);
      
      // Modal should be closed
      expect(finalState.matchEndModal.isOpen).toBe(false);
    });

    it('should save 0-0 draw matches to history when accepting match end modal', () => {
      const state = useGameStore.getState();
      
      // Set up a 0-0 draw scenario 
      state.updateScore('A', 0);
      state.updateScore('B', 0);
      
      // Show modal for draw (simulates time running out with no goals)
      state.showMatchEndModal('draw');
      
      // Accept the match end (should save to history)
      state.acceptMatchEnd();
      
      // Verify the 0-0 draw match was saved to history
      const history = state.getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].result).toBe('draw');
      expect(history[0].teamA.score).toBe(0);
      expect(history[0].teamB.score).toBe(0);
    });

    it('should save win matches to history when accepting match end modal', () => {
      const state = useGameStore.getState();
      
      // Set up a win scenario (scores 2-1)
      state.updateScore('A', 2);
      state.updateScore('B', 1);
      
      // Show modal for team A win (simulates 2 goals scored)
      state.showMatchEndModal('A');
      
      // Accept the match end (should save to history)
      state.acceptMatchEnd();
      
      // Verify the win match was saved to history
      const history = state.getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].result).toBe('A');
      expect(history[0].teamA.score).toBe(2);
      expect(history[0].teamB.score).toBe(1);
    });
  });

  describe('Triangular Finalization', () => {
    it('should finalize triangular and send result', async () => {
      const store = useGameStore.getState();
      const mockPostTriangularResult = jest.fn().mockResolvedValue(undefined);
      mockApi.triangular.postTriangularResult = mockPostTriangularResult;
      
      // Setup some scores and goals
      store.updateDailyScore('Equipo 1', 'win');
      store.updateDailyScore('Equipo 1', 'normalWin');
      store.updateDailyScore('Equipo 2', 'draw');
      store.registerGoal('player1');
      
      await store.finalizeTriangular();
      
      expect(mockApi.triangular.postTriangularResult).toHaveBeenCalledWith(
        expect.objectContaining({
          teams: expect.objectContaining({
            first: expect.objectContaining({
              name: 'Equipo 1',
              points: 5, // 3 + 2
              wins: 1,
              normalWins: 1,
              draws: 0,
            }),
            second: expect.objectContaining({
              name: 'Equipo 2',
              points: 1, // 1 from draw
              wins: 0,
              normalWins: 0,
              draws: 1,
            }),
            third: expect.objectContaining({
              name: 'Equipo 3',
              points: 0,
            }),
          }),
          scorers: { player1: 1 },
        })
      );
      
      // Check that state was reset
      const state = useGameStore.getState();
      expect(state.currentGoals).toEqual({});
      expect(state.matchHistory).toEqual([]);
      expect(state.dailyScores.every(score => score.points === 0)).toBe(true);
      expect(state.scores.teamA).toBe(0);
      expect(state.scores.teamB).toBe(0);
      expect(state.isActive).toBe(false);
    });

    it('should handle API error during finalization', async () => {
      const store = useGameStore.getState();
      const mockPostTriangularResult = jest.fn().mockRejectedValue(new Error('API Error'));
      mockApi.triangular.postTriangularResult = mockPostTriangularResult;
      
      await expect(store.finalizeTriangular()).rejects.toThrow('API Error');
    });
  });

  describe('Reset Functions', () => {
    it('should reset game state but keep daily scores', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateScore('B', 1);
      store.registerGoal('player1');
      store.setIsActive(true);
      store.updateDailyScore('Equipo 1', 'win');
      
      store.resetGame();
      const state = useGameStore.getState();
      
      expect(state.scores.teamA).toBe(0);
      expect(state.scores.teamB).toBe(0);
      expect(state.currentMatchGoals).toEqual({});
      expect(state.isActive).toBe(false);
      expect(state.timer.isRunning).toBe(false);
      
      // Daily scores and overall goals should remain
      expect(state.dailyScores[0].points).toBe(3);
      expect(state.currentGoals['player1']).toBe(1);
    });

    it('should reset all scores', () => {
      const store = useGameStore.getState();
      store.updateScore('A', 2);
      store.updateDailyScore('Equipo 1', 'win');
      store.registerGoal('player1');
      
      store.resetAllScores();
      const state = useGameStore.getState();
      
      expect(state.scores.teamA).toBe(0);
      expect(state.scores.teamB).toBe(0);
      expect(state.dailyScores.every(score => score.points === 0)).toBe(true);
      expect(state.currentGoals).toEqual({});
    });
  });

  describe('Modal Management', () => {
    it('should pre-calculate draw choice when showing modal for first match draw', () => {
      const store = useGameStore.getState();
      
      // Simular primer partido (sin historial)
      store.resetAllScores();
      
      // Mock Math.random para controlar el resultado
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.3); // < 0.5, debería resultar en "B"
      
      try {
        store.showMatchEndModal("draw");
        
        const state = useGameStore.getState();
        expect(state.matchEndModal.isOpen).toBe(true);
        expect(state.matchEndModal.result).toBe("draw");
        expect(state.matchEndModal.preCalculatedDrawChoice).toBe("B");
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should pre-calculate draw choice with different random value', () => {
      const store = useGameStore.getState();
      
      // Simular primer partido (sin historial)
      store.resetAllScores();
      
      // Mock Math.random para controlar el resultado
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.7); // >= 0.5, debería resultar en "A"
      
      try {
        store.showMatchEndModal("draw");
        
        const state = useGameStore.getState();
        expect(state.matchEndModal.isOpen).toBe(true);
        expect(state.matchEndModal.result).toBe("draw");
        expect(state.matchEndModal.preCalculatedDrawChoice).toBe("A");
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should not pre-calculate draw choice for non-first match draws', () => {
      const store = useGameStore.getState();
      
      // Simular que ya hubo un partido previo
      store.resetAllScores();
      
      // Usar setState del store para simular historial
      useGameStore.setState((state) => ({
        ...state,
        lastWinner: "A", // Ya hay historial
      }));
      
      store.showMatchEndModal("draw");
      
      const state = useGameStore.getState();
      expect(state.matchEndModal.isOpen).toBe(true);
      expect(state.matchEndModal.result).toBe("draw");
      expect(state.matchEndModal.preCalculatedDrawChoice).toBe(null);
    });
  });
}); 