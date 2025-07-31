import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, Season } from "@/lib/api";

export interface SeasonState {
  // Current state
  seasons: Season[];
  selectedSeason: Season | null;
  activeSeason: Season | null;
  allSeasonsSelected: boolean;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSeasons: () => Promise<void>;
  fetchActiveSeason: () => Promise<void>;
  setSelectedSeason: (season: Season | null) => void;
  setAllSeasonsSelected: (allSeasons: boolean) => void;
  createSeason: (name: string, initDate?: Date) => Promise<Season>;
  moveTriangularToSeason: (triangularId: string, seasonId: string) => Promise<void>;
  updateSeasonName: (seasonId: string, name: string) => Promise<Season>;
  
  // Computed getters
  getSelectedSeasonId: () => string | undefined;
  isAllSeasonsMode: () => boolean;
  getCurrentSeasonForDisplay: () => string;
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set, get) => ({
      // Initial state
      seasons: [],
      selectedSeason: null,
      activeSeason: null,
      allSeasonsSelected: false,
      loading: false,
      error: null,

      // Actions
      fetchSeasons: async () => {
        try {
          set({ loading: true, error: null });
          const seasons = await api.seasons.getAllSeasons();
          
          // Sort seasons by initSeasonDate desc (most recent first)
          const sortedSeasons = seasons.sort((a, b) => 
            new Date(b.initSeasonDate).getTime() - new Date(a.initSeasonDate).getTime()
          );
          
          set({ 
            seasons: sortedSeasons, 
            loading: false 
          });
          
          // If no season is selected and we have seasons, select the most recent one
          const currentState = get();
          if (!currentState.selectedSeason && !currentState.allSeasonsSelected && sortedSeasons.length > 0) {
            const mostRecentSeason = sortedSeasons[0];
            set({ selectedSeason: mostRecentSeason });
          }
          
        } catch (error) {
          console.error("Error fetching seasons:", error);
          set({ 
            error: "Error al cargar temporadas", 
            loading: false 
          });
        }
      },

      fetchActiveSeason: async () => {
        try {
          const activeSeason = await api.seasons.getActiveSeason();
          set({ activeSeason });
        } catch (error) {
          console.error("Error fetching active season:", error);
          set({ error: "Error al cargar temporada activa" });
        }
      },

      setSelectedSeason: (season: Season | null) => {
        set({ 
          selectedSeason: season, 
          allSeasonsSelected: false 
        });
      },

      setAllSeasonsSelected: (allSeasons: boolean) => {
        set({ 
          allSeasonsSelected: allSeasons,
          selectedSeason: allSeasons ? null : get().selectedSeason
        });
      },

      createSeason: async (name: string, initDate?: Date) => {
        try {
          set({ loading: true, error: null });
          
          const seasonData: { name: string; initSeasonDate?: string } = { name };
          if (initDate) {
            seasonData.initSeasonDate = initDate.toISOString();
          }
          
          const newSeason = await api.seasons.createSeason(seasonData);
          
          // Refresh seasons list
          await get().fetchSeasons();
          
          // Set the new season as selected
          set({ 
            selectedSeason: newSeason,
            allSeasonsSelected: false
          });
          
          set({ loading: false });
          return newSeason;
        } catch (error) {
          console.error("Error creating season:", error);
          set({
            error: "Error al crear temporada",
            loading: false
          });
          throw error;
        }
      },

      moveTriangularToSeason: async (triangularId: string, seasonId: string) => {
        try {
          await api.seasons.moveTriangularToSeason(triangularId, seasonId);
        } catch (error) {
          console.error("Error moving triangular to season:", error);
          throw error;
        }
      },

      updateSeasonName: async (seasonId: string, name: string) => {
        try {
          set({ loading: true, error: null });
          
          const updatedSeason = await api.seasons.updateSeasonName(seasonId, name);
          
          // Update the season in the local state
          const currentState = get();
          const updatedSeasons = currentState.seasons.map(season => 
            season.id === seasonId ? updatedSeason : season
          );
          
          set({ 
            seasons: updatedSeasons,
            selectedSeason: currentState.selectedSeason?.id === seasonId ? updatedSeason : currentState.selectedSeason,
            loading: false 
          });
          
          return updatedSeason;
        } catch (error) {
          console.error("Error updating season name:", error);
          set({
            error: "Error al actualizar nombre de temporada",
            loading: false
          });
          throw error;
        }
      },

      // Computed getters
      getSelectedSeasonId: () => {
        const state = get();
        return state.allSeasonsSelected ? undefined : state.selectedSeason?.id;
      },

      isAllSeasonsMode: () => {
        return get().allSeasonsSelected;
      },

      getCurrentSeasonForDisplay: () => {
        const state = get();
        if (state.allSeasonsSelected) {
          return "Todas las temporadas";
        }
        return state.selectedSeason?.name || "Sin temporada seleccionada";
      },
    }),
    {
      name: "season-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedSeason: state.selectedSeason,
        allSeasonsSelected: state.allSeasonsSelected,
      }),
    }
  )
);