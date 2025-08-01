"use client";

import { useEffect, useState } from "react";
import { useSeasonStore } from "@/store/seasonStore";
import { useStatsStore } from "@/store/statsStore";
import { useHydration } from "@/hooks/useHydration";
import { Season } from "@/lib/api";

interface SeasonSelectorProps {
  onSeasonChange?: (seasonId: string | null, allSeasons: boolean) => void;
  className?: string;
  showLabel?: boolean;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  onSeasonChange,
  className = "",
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isHydrated = useHydration();
  
  const {
    seasons,
    selectedSeason,
    allSeasonsSelected,
    loading,
    error,
    fetchSeasons,
    setSelectedSeason,
    setAllSeasonsSelected,
    getCurrentSeasonForDisplay
  } = useSeasonStore();

  const { setSeasonFilter } = useStatsStore();

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const handleSeasonSelect = (season: Season | null, allSeasons = false) => {
    if (allSeasons) {
      setAllSeasonsSelected(true);
      setSeasonFilter(null, true);
      onSeasonChange?.(null, true);
    } else {
      setSelectedSeason(season);
      setSeasonFilter(season?.id || null, false);
      onSeasonChange?.(season?.id || null, false);
    }
    setIsOpen(false);
  };

  const formatSeasonDateRange = (season: Season) => {
    const startDate = new Date(season.initSeasonDate).toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric'
    });
    
    const endDate = season.finishSeasonDate 
      ? new Date(season.finishSeasonDate).toLocaleDateString('es-ES', {
          month: 'short',
          year: 'numeric'
        })
      : 'Actual';
    
    return `${startDate} - ${endDate}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && <span className="text-sm font-medium text-gray-300">Temporada:</span>}
        <div className="animate-pulse bg-gray-700 h-8 w-32 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && <span className="text-sm font-medium text-gray-300">Temporada:</span>}
        <span className="text-red-400 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Temporada
        </label>
      )}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-left text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          type="button"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {!isHydrated ? "Cargando..." : getCurrentSeasonForDisplay()}
              </span>
              {isHydrated && selectedSeason && (
                <span className="text-xs text-gray-400">
                  {formatSeasonDateRange(selectedSeason)} • {selectedSeason.triangularCount || 0} triangulares
                </span>
              )}
              {isHydrated && allSeasonsSelected && seasons.length > 0 && (
                <span className="text-xs text-gray-400">
                  {seasons.reduce((sum, s) => sum + (s.triangularCount || 0), 0)} triangulares totales
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {/* All Seasons Option */}
              <button
                onClick={() => handleSeasonSelect(null, true)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-600 ${
                  allSeasonsSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    Todas las temporadas
                  </span>
                  <span className="text-xs text-gray-400">
                    Ver datos históricos completos
                  </span>
                </div>
              </button>

              {/* Individual Seasons */}
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonSelect(season)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                    selectedSeason?.id === season.id && !allSeasonsSelected
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {season.name}
                      </span>
                      {!season.finishSeasonDate && (
                        <span className="text-xs bg-green-600 text-green-100 px-2 py-1 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatSeasonDateRange(season)} • {season.triangularCount || 0} triangulares
                    </span>
                  </div>
                </button>
              ))}

              {seasons.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No hay temporadas disponibles
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};