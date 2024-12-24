import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GameState,
  GameTeam,
  Team,
  TeamBuilderState,
  TeamScore,
  TriangularResult,
} from "@/types";
import { postTriangularResult } from "@/lib/api";

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

          switch (winner) {
            case "A":
              newActiveTeams = {
                teamA: activeTeams.teamA,
                teamB: activeTeams.waiting,
                waiting: activeTeams.teamB,
              };
              break;
            case "B":
              newActiveTeams = {
                teamA: activeTeams.waiting,
                teamB: activeTeams.teamB,
                waiting: activeTeams.teamA,
              };
              break;
            default:
              newActiveTeams = {
                teamA: activeTeams.waiting,
                teamB: activeTeams.teamB,
                waiting: activeTeams.teamA,
              };
          }

          return {
            ...state,
            activeTeams: newActiveTeams,
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

      finalizeTriangular: async () => {
        const state = get();
        const teams = [
          {
            name: "Equipo 1",
            score: state.dailyScores[0].points,
            members: state.activeTeams.teamA.members,
          },
          {
            name: "Equipo 2",
            score: state.dailyScores[1].points,
            members: state.activeTeams.teamB.members,
          },
          {
            name: "Equipo 3",
            score: state.dailyScores[2].points,
            members: state.activeTeams.waiting.members,
          },
        ].sort((a, b) => b.score - a.score);

        const result: TriangularResult = {
          date: new Date().toISOString(),
          teams: {
            first: {
              players: teams[0].members.map((m) => Number(m.id)),
              points: teams[0].score,
            },
            second: {
              players: teams[1].members.map((m) => Number(m.id)),
              points: teams[1].score,
            },
            third: {
              players: teams[2].members.map((m) => Number(m.id)),
              points: teams[2].score,
            },
          },
          scorers: Object.fromEntries(
            Object.entries(state.currentGoals).map(([id, goals]) => [
              Number(id),
              goals,
            ])
          ),
        };

        await postTriangularResult(result);
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
