import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GameState,
  GameTeam,
  Player,
  Team,
  TeamBuilderState,
  TeamScore,
  TriangularResult,
} from "@/types";
import { api } from "@/lib/api";

interface GameStore extends GameState {
  // Funciones de actualización de score
  updateScore: (team: "A" | "B", score: number) => void;
  validateAndUpdateScore: (team: "A" | "B", score: number) => void;

  // Funciones de rotación de equipos
  rotateTeams: (winner: "A" | "B" | "draw") => void;

  // Funciones de puntajes diarios
  updateDailyScore: (team: Team, type: "win" | "normalWin" | "draw") => void;
  getTeamStats: (teamName: Team) => TeamScore | undefined;

  // Funciones de control de juego
  setIsActive: (active: boolean) => void;
  resetGame: () => void;
  resetAllScores: () => void;

  // Funciones de utilidad
  isValidTeam: (teamName: string) => teamName is Team;
  getTotalMatches: (teamName: Team) => number;
  getWinPercentage: (teamName: Team) => number;

  setTimeLeft: (time: number) => void;
  resetTimer: () => void;

  startTimer: () => void;
  stopTimer: () => void;
  getTimeLeft: () => number;
  updateTeamPlayers: (teamBuilder: TeamBuilderState) => void;
  assignTeamsToGame: (teams: {
    teamA: Team;
    teamB: Team;
    waiting: Team;
  }) => void;
  setTeams: (teams: {
    teamA: GameTeam;
    teamB: GameTeam;
    waiting: GameTeam;
  }) => void;

  registerGoal: (playerId: string) => void;
  finalizeTriangular: () => Promise<void>;
  updateAvailablePlayers: (players: Player[]) => void;
}

const MATCH_DURATION = 7 * 60;

const initialState: GameState = {
  activeTeams: {
    teamA: { name: "Equipo 1", members: [] },
    teamB: { name: "Equipo 2", members: [] },
    waiting: { name: "Equipo 3", members: [] },
  },
  scores: {
    teamA: 0,
    teamB: 0,
  },
  dailyScores: [
    { name: "Equipo 1", points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: "Equipo 2", points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: "Equipo 3", points: 0, wins: 0, normalWins: 0, draws: 0 },
  ],
  timer: {
    endTime: null,
    MATCH_DURATION,
  },
  isActive: false,
  teamBuilder: {
    available: [],
    team1: [],
    team2: [],
    team3: [],
  },
  currentGoals: {},
  lastWinner: "",
  lastDraw: "",
  selectedPlayers: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Funciones de actualización de score
      updateScore: (team, score) =>
        set((state) => ({
          ...state,
          scores: {
            ...state.scores,
            [`team${team}`]: score,
          },
        })),

      validateAndUpdateScore: (team, score) => {
        if (score >= 0 && score <= 2) {
          get().updateScore(team, score);
        }
      },

      // Funciones de rotación de equipos
      rotateTeams: (winner) =>
        set((state) => {
          const { activeTeams } = state;
          let newActiveTeams;
          let lastWinner = state.lastWinner;
          let lastDraw = state.lastDraw;

          switch (winner) {
            case "A":
              newActiveTeams = {
                teamA: activeTeams.teamA,
                teamB: activeTeams.waiting,
                waiting: activeTeams.teamB,
              };
              lastWinner = "A";
              lastDraw = "";
              break;
            case "B":
              newActiveTeams = {
                teamA: activeTeams.waiting,
                teamB: activeTeams.teamB,
                waiting: activeTeams.teamA,
              };
              lastWinner = "B";
              lastDraw = "";
              break;
            default:
              if (lastWinner === "A") {
                //Si lastWinner es A, debe jugar teamB contra waiting
                newActiveTeams = {
                  teamA: activeTeams.waiting,
                  teamB: activeTeams.teamB,
                  waiting: activeTeams.teamA,
                };
                lastWinner = "";
                lastDraw = "B";
              } else if (lastWinner === "B") {
                //Si lastWinner es B, debe jugar teamA contra waiting
                newActiveTeams = {
                  teamA: activeTeams.teamA,
                  teamB: activeTeams.waiting,
                  waiting: activeTeams.teamB,
                };
                lastWinner = "";
                lastDraw = "A";
              } else if (lastDraw === "A") {
                //Si empato el a en su segundo partido
                newActiveTeams = {
                  teamA: activeTeams.waiting,
                  teamB: activeTeams.teamB,
                  waiting: activeTeams.teamA,
                };
                lastDraw = "B";
                lastWinner = "";
              } else if (lastDraw === "B") {
                //Si empato el b en su segundo partido
                newActiveTeams = {
                  teamA: activeTeams.teamA,
                  teamB: activeTeams.waiting,
                  waiting: activeTeams.teamB,
                };
                lastDraw = "A";
                lastWinner = "";
              } else {
                //Primer cambio, si nadie empato ni gano antes
                newActiveTeams = {
                  teamA: activeTeams.waiting,
                  teamB: activeTeams.teamB,
                  waiting: activeTeams.teamA,
                };
                lastDraw = "B";
                lastWinner = "";
              }
          }

          return {
            ...state,
            activeTeams: newActiveTeams,
            lastWinner: lastWinner,
            lastDraw: lastDraw,
          };
        }),

      // Funciones de puntajes diarios
      updateDailyScore: (team, type) =>
        set((state) => {
          const pointsToAdd = type === "win" ? 3 : type === "normalWin" ? 2 : 1;
          const statToUpdate =
            type === "win"
              ? "wins"
              : type === "normalWin"
              ? "normalWins"
              : "draws";

          return {
            ...state,
            dailyScores: state.dailyScores.map((score) =>
              score.name === team
                ? {
                    ...score,
                    points: score.points + pointsToAdd,
                    [statToUpdate]: score[statToUpdate] + 1,
                  }
                : score
            ),
          };
        }),

      getTeamStats: (teamName) => {
        return get().dailyScores.find((score) => score.name === teamName);
      },

      resetAllScores: () => set(initialState),

      // Funciones de utilidad
      isValidTeam: (teamName): teamName is Team => {
        return ["Equipo 1", "Equipo 2", "Equipo 3"].includes(teamName);
      },

      getTotalMatches: (teamName) => {
        const stats = get().getTeamStats(teamName);
        if (!stats) return 0;
        return stats.wins + stats.normalWins + stats.draws;
      },

      getWinPercentage: (teamName) => {
        const stats = get().getTeamStats(teamName);
        if (!stats) return 0;
        const totalMatches = get().getTotalMatches(teamName);
        if (totalMatches === 0) return 0;
        return ((stats.wins + stats.normalWins) / totalMatches) * 100;
      },

      setTimeLeft: (time) =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            timeLeft: time,
          },
        })),

      resetTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            timeLeft: state.timer.MATCH_DURATION,
          },
        })),

      startTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            endTime: Date.now() + state.timer.MATCH_DURATION * 1000,
            //endTime: Date.now() + state.timer.MATCH_DURATION + 6000,
          },
        })),

      stopTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            endTime: null,
          },
        })),

      getTimeLeft: () => {
        const state = get();
        if (!state.timer.endTime) return state.timer.MATCH_DURATION;

        const timeLeft = Math.ceil((state.timer.endTime - Date.now()) / 1000);
        return Math.max(0, Math.min(timeLeft, state.timer.MATCH_DURATION));
      },

      setIsActive: (active) => {
        const state = get();
        if (active) {
          get().startTimer();
        } else {
          get().stopTimer();
        }
        set({ ...state, isActive: active });
      },

      resetGame: () =>
        set((state) => ({
          ...state,
          scores: { teamA: 0, teamB: 0 },
          isActive: false,
          timer: {
            ...state.timer,
            endTime: null,
          },
        })),
      updateTeamPlayers: (teamBuilder) =>
        set((state) => ({
          ...state,
          teamBuilder,
        })),

      assignTeamsToGame: () =>
        set((state) => ({
          ...state,
          activeTeams: {
            teamA: {
              name: "Equipo 1",
              members: state.teamBuilder.team1.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
            teamB: {
              name: "Equipo 2",
              members: state.teamBuilder.team2.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
            waiting: {
              name: "Equipo 3",
              members: state.teamBuilder.team3.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
          },
        })),

      setTeams: (teams: {
        teamA: GameTeam;
        teamB: GameTeam;
        waiting: GameTeam;
      }) =>
        set((state) => ({
          ...state,
          activeTeams: teams,
        })),

      registerGoal: (playerId) =>
        set((state) => ({
          ...state,
          currentGoals: {
            ...state.currentGoals,
            [playerId]: (state.currentGoals[playerId] || 0) + 1,
          },
        })),

      updateAvailablePlayers: (players: Player[]) =>
        set((state) => ({
          ...state,
          selectedPlayers: players,
          teamBuilder: {
            available: players,
            team1: [],
            team2: [],
            team3: [],
          },
        })),

      finalizeTriangular: async () => {
        const state = get();

        // Obtener los datos de los equipos
        const teamsData = [
          {
            index: 0,
            name: "Equipo 1",
            score: state.dailyScores[0].points,
            members: state.activeTeams.teamA.members,
            stats: state.dailyScores[0],
          },
          {
            index: 1,
            name: "Equipo 2",
            score: state.dailyScores[1].points,
            members: state.activeTeams.teamB.members,
            stats: state.dailyScores[1],
          },
          {
            index: 2,
            name: "Equipo 3",
            score: state.dailyScores[2].points,
            members: state.activeTeams.waiting.members,
            stats: state.dailyScores[2],
          },
        ].sort((a, b) => b.score - a.score);

        // Crear el resultado del triangular
        const result: TriangularResult = {
          date: new Date().toISOString(),
          teams: {
            first: {
              name: teamsData[0].name as Team,
              players: teamsData[0].members.map((m) => m.id),
              points: teamsData[0].score,
              wins: teamsData[0].stats.wins,
              normalWins: teamsData[0].stats.normalWins,
              draws: teamsData[0].stats.draws,
            },
            second: {
              name: teamsData[1].name as Team,
              players: teamsData[1].members.map((m) => m.id),
              points: teamsData[1].score,
              wins: teamsData[1].stats.wins,
              normalWins: teamsData[1].stats.normalWins,
              draws: teamsData[1].stats.draws,
            },
            third: {
              name: teamsData[2].name as Team,
              players: teamsData[2].members.map((m) => m.id),
              points: teamsData[2].score,
              wins: teamsData[2].stats.wins,
              normalWins: teamsData[2].stats.normalWins,
              draws: teamsData[2].stats.draws,
            },
          },
          // Mantener los IDs como strings, sin convertir a Number
          scorers: state.currentGoals,
        };

        console.log("Enviando resultado del triangular:", result);

        // Enviar el resultado al servidor
        await api.triangular.postTriangularResult(result);

        // Resetear el estado
        set((state) => ({
          ...state,
          currentGoals: {},
          dailyScores: [
            { name: "Equipo 1", points: 0, wins: 0, normalWins: 0, draws: 0 },
            { name: "Equipo 2", points: 0, wins: 0, normalWins: 0, draws: 0 },
            { name: "Equipo 3", points: 0, wins: 0, normalWins: 0, draws: 0 },
          ],
          scores: {
            teamA: 0,
            teamB: 0,
          },
          isActive: false,
          timer: {
            ...state.timer,
            endTime: null,
          },
        }));
      },
    }),

    {
      name: "game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dailyScores: state.dailyScores,
        activeTeams: state.activeTeams,
        scores: state.scores,
        isActive: state.isActive,
        timer: state.timer,
        teamBuilder: state.teamBuilder,
        currentGoals: state.currentGoals,
      }),
    }
  )
);
