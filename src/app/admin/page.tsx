"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TriangularHistory, Team } from "@/types";
import { api, Season } from "@/lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getColorByTeam } from "@/lib/helpers/helpers";
import { DndContext, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SoccerBallIcon } from '@/components/ui/icons';
import { useSeasonStore } from "@/store/seasonStore";

interface EditFormData {
  champion: string;
  date: string;
}

interface DeleteConfirmation {
  id: string;
  title: string;
}

interface CreateFormData {
  date: string;
  teams: {
    first: {
      name: Team;
      players: string[];
      points: number;
      wins: number;
      draws: number;
    };
    second: {
      name: Team;
      players: string[];
      points: number;
      wins: number;
      draws: number;
    };
    third: {
      name: Team;
      players: string[];
      points: number;
      wins: number;
      draws: number;
    };
  };
  scorers: { [playerId: string]: number };
}

export default function AdminPage() {
  const [triangulars, setTriangulars] = useState<TriangularHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [triangularsLoading, setTriangularsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({ champion: "", date: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    date: new Date().toISOString().split('T')[0],
    teams: {
      first: { name: "Equipo 1", players: [], points: 0, wins: 0, draws: 0 },
      second: { name: "Equipo 2", players: [], points: 0, wins: 0, draws: 0 },
      third: { name: "Equipo 3", players: [], points: 0, wins: 0, draws: 0 }
    },
    scorers: {}
  });
  const [availablePlayers, setAvailablePlayers] = useState<{ id: string; name: string }[]>([]);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [selectedTeamKey, setSelectedTeamKey] = useState<'first' | 'second' | 'third' | null>(null);
  const [showCalculatorInfo, setShowCalculatorInfo] = useState(false);
  const calculatorInfoRef = useRef<HTMLDivElement>(null);
  const [selectedTriangularId, setSelectedTriangularId] = useState<string | null>(null);
  const [editTeams, setEditTeams] = useState<{ [team in Team]: { id: string; name: string; goals: number; team: Team }[] }>({
    'Equipo 1': [], 'Equipo 2': [], 'Equipo 3': []
  });

  // Season editing states
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [editingSeasonName, setEditingSeasonName] = useState<string>("");
  
  const [editScorers, setEditScorers] = useState<Array<{ id?: string; name?: string; goals: number; team: Team }>>([]);
  const [showEditTeamsModal, setShowEditTeamsModal] = useState(false);
  const [editTeamsTriangular, setEditTeamsTriangular] = useState<TriangularHistory | null>(null);
  const [isSavingEditTeams, setIsSavingEditTeams] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Season management state
  const [showCreateSeasonModal, setShowCreateSeasonModal] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [showMoveTriangularModal, setShowMoveTriangularModal] = useState(false);
  const [triangularToMove, setTriangularToMove] = useState<string | null>(null);
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");

  // Router for navigation
  const router = useRouter();

  // Season store
  const { 
    seasons, 
    selectedSeason,
    allSeasonsSelected,
    fetchSeasons, 
    createSeason, 
    moveTriangularToSeason,
    updateSeasonName,
    setSelectedSeason,
    setAllSeasonsSelected,
    getSelectedSeasonId,
    loading: seasonsLoading 
  } = useSeasonStore();

  // Paleta de colores hexadecimales para los equipos
  const teamBgColors = {
    'Equipo 1': 'bg-[#ffd60a]', // Amarillo
    'Equipo 2': 'bg-[#ff4d6d]', // Rosa
    'Equipo 3': 'bg-[#ced4da]', // Negro
  };

  const loadTriangulars = useCallback(async () => {
    try {
      setTriangularsLoading(true);
      const selectedSeasonId = getSelectedSeasonId();
      const data = await api.triangular.getTriangularHistory(selectedSeasonId, allSeasonsSelected);
      setTriangulars(data);
    } catch (error) {
      toast.error("Error al cargar triangulares");
      console.error("Error loading triangulars:", error);
    } finally {
      setTriangularsLoading(false);
    }
  }, [getSelectedSeasonId, allSeasonsSelected]);

  // Efecto inicial: carga players y seasons, pero NO triangulars aún
  useEffect(() => {
    loadPlayers();
    fetchSeasons();
    setLoading(false); // El loading principal se completa aquí
  }, [fetchSeasons]);

  // Efecto para seleccionar automáticamente la temporada activa cuando se cargan las temporadas
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason && allSeasonsSelected) {
      // Buscar la temporada activa (sin finishSeasonDate)
      const activeSeason = seasons.find(season => !season.finishSeasonDate);
      if (activeSeason) {
        setSelectedSeason(activeSeason);
      }
    }
  }, [seasons, selectedSeason, allSeasonsSelected, setSelectedSeason]);

  // Efecto separado para cargar triangulares cuando cambie la selección de temporada
  useEffect(() => {
    // Solo cargar triangulares si ya se han cargado las temporadas, O si es la carga inicial
    if (seasons.length > 0 || (seasons.length === 0 && !seasonsLoading)) {
      loadTriangulars();
    }
  }, [selectedSeason, allSeasonsSelected, loadTriangulars, seasons.length, seasonsLoading]);

  // Cerrar popup al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calculatorInfoRef.current && !calculatorInfoRef.current.contains(event.target as Node)) {
        setShowCalculatorInfo(false);
      }
    };

    if (showCalculatorInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalculatorInfo]);

  const loadPlayers = async () => {
    try {
      const players = await api.players.getSimplePlayers();
      setAvailablePlayers(players.map(p => ({ id: p.id, name: p.name })));
    } catch (error) {
      console.error("Error loading players:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await api.triangular.updateTriangular(editingId, editForm);
      toast.success("Triangular actualizado exitosamente");
      setEditingId(null);
      loadTriangulars();
    } catch (error) {
      toast.error("Error al actualizar triangular");
      console.error("Error updating triangular:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ champion: "", date: "" });
  };

  const handleDeleteClick = (triangular: TriangularHistory) => {
    setDeleteConfirm({
      id: triangular.id,
      title: `Triangular del ${new Date(triangular.date).toLocaleDateString()}`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.triangular.deleteTriangular(deleteConfirm.id);
      toast.success("Triangular eliminado exitosamente");
      setDeleteConfirm(null);
      loadTriangulars();
    } catch (error) {
      toast.error("Error al eliminar triangular");
      console.error("Error deleting triangular:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTriangular = async () => {
    try {
      // Convertir teams a array con posición
      const teamKeys: Array<'first' | 'second' | 'third'> = ['first', 'second', 'third'];
      const teamsArray = teamKeys.map((key, idx) => ({
        ...createForm.teams[key],
        normalWins: 0, // Mantener para compatibilidad de tipos
        position: idx + 1,
      }));
      const triangularData = {
        date: createForm.date,
        teams: teamsArray,
        scorers: createForm.scorers
      };
      await api.triangular.postTriangularResult(triangularData);
      toast.success("Triangular creado exitosamente");
      setShowCreateModal(false);
      resetCreateForm();
      loadTriangulars();
    } catch (error) {
      toast.error("Error al crear triangular");
      console.error("Error creating triangular:", error);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      date: new Date().toISOString().split('T')[0],
      teams: {
        first: { name: "Equipo 1", players: [], points: 0, wins: 0, draws: 0 },
        second: { name: "Equipo 2", players: [], points: 0, wins: 0, draws: 0 },
        third: { name: "Equipo 3", players: [], points: 0, wins: 0, draws: 0 }
      },
      scorers: {}
    });
    // Reset player selector state
    setShowPlayerSelector(false);
    setSelectedTeamKey(null);
  };

  const removePlayerFromTeam = (teamKey: 'first' | 'second' | 'third', playerIndex: number) => {
    setCreateForm(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [teamKey]: {
          ...prev.teams[teamKey],
          players: prev.teams[teamKey].players.filter((_, index) => index !== playerIndex)
        }
      }
    }));
  };

  const updateTeamStats = (teamKey: 'first' | 'second' | 'third', field: string, value: number) => {
    setCreateForm(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [teamKey]: {
          ...prev.teams[teamKey],
          [field]: value
        }
      }
    }));
  };

  const updatePlayerGoals = (playerId: string, goals: number) => {
    setCreateForm(prev => ({
      ...prev,
      scorers: {
        ...prev.scorers,
        [playerId]: goals
      }
    }));
  };

  const calculateTeamStats = (teamPoints: number[], teamGoals: number[]) => {
    const teamsWithStats = teamPoints.map((points, index) => ({
      index,
      points,
      goals: teamGoals[index],
      wins: 0,
      draws: 0
    }));

    teamsWithStats.forEach(team => {
      const points = team.points;
      let remainingPoints = points;
      
      // Todas las victorias ahora valen 3 puntos
      team.wins = Math.floor(points / 3);
      remainingPoints = points % 3;
      
      // Empates con puntos restantes (solo 1 punto cada uno)
      team.draws = remainingPoints;
    });

    return teamsWithStats;
  };

  const autoCalculateStats = () => {
    const teamPoints = [
      createForm.teams.first.points,
      createForm.teams.second.points,
      createForm.teams.third.points
    ];
    
    const teamGoals = [
      Object.keys(createForm.scorers)
        .filter(playerId => createForm.teams.first.players.includes(playerId))
        .reduce((sum, playerId) => sum + (createForm.scorers[playerId] || 0), 0),
      Object.keys(createForm.scorers)
        .filter(playerId => createForm.teams.second.players.includes(playerId))
        .reduce((sum, playerId) => sum + (createForm.scorers[playerId] || 0), 0),
      Object.keys(createForm.scorers)
        .filter(playerId => createForm.teams.third.players.includes(playerId))
        .reduce((sum, playerId) => sum + (createForm.scorers[playerId] || 0), 0)
    ];

    const calculatedStats = calculateTeamStats(teamPoints, teamGoals);
    const teamKeys: Array<'first' | 'second' | 'third'> = ['first', 'second', 'third'];
    
    setCreateForm(prev => {
      const newTeams = { ...prev.teams };
      
      calculatedStats.forEach(stat => {
        const teamKey = teamKeys[stat.index];
        newTeams[teamKey] = {
          ...newTeams[teamKey],
          wins: stat.wins,
          draws: stat.draws
        };
      });

      return {
        ...prev,
        teams: newTeams
      };
    });

    toast.success("Estimación de estadísticas calculada basándose en los puntos totales");
  };

  const openPlayerSelector = (teamKey: 'first' | 'second' | 'third') => {
    setSelectedTeamKey(teamKey);
    setShowPlayerSelector(true);
  };

  const togglePlayerSelection = (playerId: string) => {
    if (!selectedTeamKey) return;

    const currentTeam = createForm.teams[selectedTeamKey];
    const isPlayerSelected = currentTeam.players.includes(playerId);

    if (isPlayerSelected) {
      // Remover jugador
      setCreateForm(prev => ({
        ...prev,
        teams: {
          ...prev.teams,
          [selectedTeamKey]: {
            ...prev.teams[selectedTeamKey],
            players: prev.teams[selectedTeamKey].players.filter(id => id !== playerId)
          }
        },
        scorers: {
          ...prev.scorers,
          [playerId]: 0
        }
      }));
    } else {
      // Agregar jugador si el equipo tiene menos de 5 jugadores
      if (currentTeam.players.length < 5) {
        setCreateForm(prev => ({
          ...prev,
          teams: {
            ...prev.teams,
            [selectedTeamKey]: {
              ...prev.teams[selectedTeamKey],
              players: [...prev.teams[selectedTeamKey].players, playerId]
            }
          }
        }));
      }
    }
  };

  const closePlayerSelector = () => {
    setShowPlayerSelector(false);
    setSelectedTeamKey(null);
  };

  const getAvailablePlayersForSelector = (): Array<{ id: string; name: string; isSelected: boolean; isDisabled: boolean }> => {
    if (!selectedTeamKey) return availablePlayers.map(player => ({ ...player, isSelected: false, isDisabled: false }));

    const currentTeamPlayers = createForm.teams[selectedTeamKey].players;
    const otherTeamsPlayers = Object.keys(createForm.teams)
      .filter(key => key !== selectedTeamKey)
      .flatMap(key => createForm.teams[key as keyof typeof createForm.teams].players);

    return availablePlayers.map(player => ({
      ...player,
      isSelected: currentTeamPlayers.includes(player.id),
      isDisabled: otherTeamsPlayers.includes(player.id)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Season management handlers
  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) {
      toast.error("El nombre de la temporada es requerido");
      return;
    }

    setIsCreatingSeason(true);
    try {
      await createSeason(newSeasonName.trim());
      toast.success("Temporada creada exitosamente");
      setShowCreateSeasonModal(false);
      setNewSeasonName("");
      loadTriangulars(); // Reload triangulars to reflect any changes
    } catch (error) {
      toast.error("Error al crear la temporada");
      console.error("Error creating season:", error);
    } finally {
      setIsCreatingSeason(false);
    }
  };

  const handleMoveTriangular = (triangularId: string) => {
    setTriangularToMove(triangularId);
    setTargetSeasonId("");
    setShowMoveTriangularModal(true);
  };

  const handleUpdateSeasonName = async () => {
    if (!editingSeasonId || !editingSeasonName.trim()) {
      toast.error("El nombre de la temporada no puede estar vacío");
      return;
    }

    try {
      await updateSeasonName(editingSeasonId, editingSeasonName.trim());
      toast.success("Nombre de temporada actualizado exitosamente");
      setEditingSeasonId(null);
      setEditingSeasonName("");
    } catch (error) {
      toast.error("Error al actualizar el nombre de la temporada");
      console.error("Error updating season name:", error);
    }
  };

  const handleCancelEditSeason = () => {
    setEditingSeasonId(null);
    setEditingSeasonName("");
  };


  const handleSeasonClick = (seasonId: string) => {
    const clickedSeason = seasons.find(s => s.id === seasonId);
    if (!clickedSeason) return;

    if (selectedSeason?.id === seasonId) {
      // Si ya está seleccionada, deseleccionar y mostrar todas
      setAllSeasonsSelected(true);
    } else {
      // Seleccionar temporada específica
      setSelectedSeason(clickedSeason);
    }
    // El useEffect se encargará de recargar automáticamente
  };


  const handleConfirmMoveTriangular = async () => {
    if (!triangularToMove || !targetSeasonId) {
      toast.error("Selecciona una temporada de destino");
      return;
    }

    try {
      await moveTriangularToSeason(triangularToMove, targetSeasonId);
      toast.success("Triangular movido exitosamente");
      setShowMoveTriangularModal(false);
      setTriangularToMove(null);
      setTargetSeasonId("");
      loadTriangulars(); // Reload triangulars to reflect changes
    } catch (error) {
      toast.error("Error al mover triangular");
      console.error("Error moving triangular:", error);
    }
  };

  const formatSeasonDate = (season: Season) => {
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

  // Handler para seleccionar un triangular y cargar equipos
  const handleSelectTriangular = (id: string) => {
    setSelectedTriangularId(id);
    const triangular = triangulars.find(t => t.id === id);
    if (triangular) {
      // Usar teamPlayers para poblar todos los jugadores de cada equipo
      const teams: { [team in Team]: { id: string; name: string; goals: number; team: Team }[] } = { 'Equipo 1': [], 'Equipo 2': [], 'Equipo 3': [] };
      (['Equipo 1', 'Equipo 2', 'Equipo 3'] as Team[]).forEach(team => {
        teams[team] = (triangular.teamPlayers?.[team] || []).map(player => ({
          id: player.id,
          name: player.name,
          goals: (triangular.scorers.find(s => s.name === player.name && s.team === team)?.goals ?? 0),
          team: team
        }));
      });
      setEditTeams(teams);
      setEditScorers(triangular.scorers || []);
    }
  };

  // Guardar cambios
  const handleSaveEditColors = async () => {
    if (!selectedTriangularId) return;
    setIsSavingEditTeams(true);
    // Construir objeto scorers actualizado con goles y equipo (formato requerido por updateTriangularTeamsAndScorers)
    const scorersObj: { [playerId: string]: { goals: number; team: Team } } = {};
    editScorers.forEach((scorer: {id?: string, name?: string, goals: number, team: Team}) => {
      if (scorer.id) {
        scorersObj[scorer.id] = { goals: scorer.goals, team: scorer.team };
      } else if (scorer.name) {
        // fallback por si el scorer tiene name en vez de id
        const player = Object.values(editTeams).flat().find(p => p.name === scorer.name);
        if (player) scorersObj[player.id] = { goals: scorer.goals, team: scorer.team };
      }
    });
    (['Equipo 1', 'Equipo 2', 'Equipo 3'] as Team[]).forEach(team => {
      editTeams[team].forEach(player => {
        if (scorersObj[player.id]) {
          scorersObj[player.id].team = team;
        }
      });
    });
    try {
      await api.triangular.updateTriangularTeamsAndScorers(selectedTriangularId, editTeams, scorersObj);
      toast.success('Cambios guardados correctamente');
      loadTriangulars();
      setShowEditTeamsModal(false);
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSavingEditTeams(false);
    }
  };

  // Handler para abrir el modal de edición de equipos
  const handleOpenEditTeamsModal = (triangular: TriangularHistory) => {
    setEditTeamsTriangular(triangular);
    // Usar teamPlayers para poblar todos los jugadores de cada equipo
    const teams: { [team in Team]: { id: string; name: string; goals: number; team: Team }[] } = { 'Equipo 1': [], 'Equipo 2': [], 'Equipo 3': [] };
    (['Equipo 1', 'Equipo 2', 'Equipo 3'] as Team[]).forEach(team => {
      teams[team] = (triangular.teamPlayers?.[team] || []).map(player => ({
        id: player.id,
        name: player.name,
        goals: (triangular.scorers.find(s => s.name === player.name && s.team === team)?.goals ?? 0),
        team: team
      }));
    });
    setEditTeams(teams);
    setEditScorers(triangular.scorers || []);
    setShowEditTeamsModal(true);
  };

  // Componente para box de equipo draggable y droppable
  function DraggableTeamBox({ team, players, color }: { team: Team, players: {id: string, name: string, goals: number, team: Team}[], color: string }) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: team });
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: team });
    const style = {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging ? 0.7 : 1,
      border: isOver ? '2px solid #333' : undefined,
      cursor: 'grab',
    };
    return (
      <div ref={node => { setDropRef(node); setDragRef(node); }} style={style} {...attributes} {...listeners} className={`${color} rounded-lg p-4 min-h-[100px]`}>
        {players.map(player => (
          <div key={player.id} className="flex items-center gap-2 mb-2">
            <span className="bg-gray-900 rounded px-2 py-1 text-sm text-white">{player.name}</span>
            <span className="text-xs text-gray-900">({player.goals})</span>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando triangulares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-gray-400 text-center">Gestión de Triangulares</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-20">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Triangulares</p>
                <p className="text-2xl font-bold text-white">{triangulars.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Último Triangular</p>
                <p className="text-sm font-bold text-white">
                  {triangulars.length > 0 ? formatDate(triangulars[0].date).split(',')[0] : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Campeón Más Frecuente</p>
                <p className="text-sm font-bold text-white">
                  {triangulars.length > 0 ? getColorByTeam(triangulars[0].champion) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Season Management */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Gestión de Temporadas</h2>
            <button
              onClick={() => setShowCreateSeasonModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Temporada
            </button>
          </div>

          <div className="p-6">
            {seasonsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : seasons.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400">No hay temporadas creadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className={`bg-gray-700 rounded-lg border ${
                      !season.finishSeasonDate ? 'border-green-500' : 'border-gray-600'
                    } ${selectedSeason?.id === season.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {/* Header clickeable */}
                    <div 
                      className={`p-4 cursor-pointer transition-colors rounded-lg ${
                        selectedSeason?.id === season.id 
                          ? 'bg-blue-700 hover:bg-blue-600' 
                          : 'hover:bg-gray-600'
                      }`}
                      onClick={() => handleSeasonClick(season.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                      {editingSeasonId === season.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSeasonName}
                            onChange={(e) => setEditingSeasonName(e.target.value)}
                            className="flex-1 bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateSeasonName();
                              } else if (e.key === 'Escape') {
                                handleCancelEditSeason();
                              }
                            }}
                          />
                          <button
                            onClick={handleUpdateSeasonName}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Guardar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEditSeason}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Cancelar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-lg font-semibold text-white">{season.name}</h3>
                      )}
                      <div className="flex items-center gap-2">
                        {selectedSeason?.id === season.id && (
                          <span className="text-xs bg-blue-600 text-blue-100 px-2 py-1 rounded-full">
                            Filtro Activo
                          </span>
                        )}
                        {!season.finishSeasonDate && (
                          <span className="text-xs bg-green-600 text-green-100 px-2 py-1 rounded-full">
                            Activa
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {formatSeasonDate(season)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        {season.triangularCount || 0} triangulares
                      </span>
                      <div className="flex items-center gap-2">
                        {editingSeasonId !== season.id && (
                          <button
                            onClick={() => {
                              setEditingSeasonId(season.id);
                              setEditingSeasonName(season.name);
                            }}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                            title="Editar nombre"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <div className={`w-3 h-3 rounded-full ${
                          !season.finishSeasonDate ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Triangulars List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Lista de Triangulares</h2>
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Triangular
              </button>
            </div>
          </div>

          {triangularsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Cargando triangulares...</p>
            </div>
          ) : triangulars.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg">No hay triangulares registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Campeón
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Podio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Goleadores
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {triangulars.map((triangular) => (
                    <tr key={triangular.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                        {triangular.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === triangular.id ? (
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <div className="text-sm text-white">{formatDate(triangular.date)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === triangular.id ? (
                          <select
                            value={editForm.champion}
                            onChange={(e) => setEditForm(prev => ({ ...prev, champion: e.target.value }))}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="Equipo 1">Equipo 1</option>
                            <option value="Equipo 2">Equipo 2</option>
                            <option value="Equipo 3">Equipo 3</option>
                          </select>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {getColorByTeam(triangular.champion)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex space-x-1">
                          {triangular.teams.map((team, index) => (
                            <span key={team.name} className={`px-2 py-1 text-xs rounded ${
                              index === 0 ? 'bg-yellow-500 text-yellow-900' :
                              index === 1 ? 'bg-gray-400 text-gray-900' :
                              'bg-orange-600 text-orange-100'
                            }`}>
                              {index + 1}° {getColorByTeam(team.name)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="max-w-xs">
                          {triangular.scorers.slice(0, 3).map((scorer, index) => (
                            <div key={index} className="text-xs">
                              {scorer.name} ({scorer.goals}⚽)
                            </div>
                          ))}
                          {triangular.scorers.length > 3 && (
                            <div className="text-xs text-gray-500">+{triangular.scorers.length - 3} más</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === triangular.id ? (
                          <div className="space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="space-x-1">
                            <button
                              onClick={() => router.push(`/historial?triangularId=${triangular.id}`)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Ver detalles del triangular"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => {
                                handleSelectTriangular(triangular.id);
                                handleOpenEditTeamsModal(triangular);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleMoveTriangular(triangular.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Mover a otra temporada"
                            >
                              Mover
                            </button>
                            <button
                              onClick={() => handleDeleteClick(triangular)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Season Modal */}
      {showCreateSeasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Crear Nueva Temporada</h3>
              <button
                onClick={() => {
                  setShowCreateSeasonModal(false);
                  setNewSeasonName("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de la Temporada
                </label>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-purple-500"
                  placeholder="ej. Season 2, Temporada Verano 2024"
                  autoFocus
                />
              </div>

              <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <strong>Nota:</strong> Al crear una nueva temporada, la temporada actual se cerrará automáticamente 
                  y todos los nuevos triangulares se asignarán a esta nueva temporada.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateSeason}
                  disabled={isCreatingSeason || !newSeasonName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isCreatingSeason && <SoccerBallIcon className="animate-spin" width={20} height={20} />}
                  Crear Temporada
                </button>
                <button
                  onClick={() => {
                    setShowCreateSeasonModal(false);
                    setNewSeasonName("");
                  }}
                  disabled={isCreatingSeason}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Triangular Modal */}
      {showMoveTriangularModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Mover Triangular</h3>
              <button
                onClick={() => {
                  setShowMoveTriangularModal(false);
                  setTriangularToMove(null);
                  setTargetSeasonId("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seleccionar Temporada de Destino
                </label>
                <select
                  value={targetSeasonId}
                  onChange={(e) => setTargetSeasonId(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Seleccionar temporada --</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} ({formatSeasonDate(season)})
                      {!season.finishSeasonDate && " - Activa"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  <strong>Advertencia:</strong> Esta acción moverá el triangular a la temporada seleccionada. 
                  Esto puede afectar las estadísticas de los jugadores.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleConfirmMoveTriangular}
                  disabled={!targetSeasonId}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Mover Triangular
                </button>
                <button
                  onClick={() => {
                    setShowMoveTriangularModal(false);
                    setTriangularToMove(null);
                    setTargetSeasonId("");
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Triangular Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Crear Nuevo Triangular</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fecha</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Auto Calculate Button with Info Popup */}
              <div className="flex justify-center mb-4">
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={autoCalculateStats}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calcular Estadísticas Automáticamente
                  </button>
                  
                  {/* Info Button */}
                  <button
                    onClick={() => setShowCalculatorInfo(!showCalculatorInfo)}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    title="Información sobre el cálculo automático"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  {/* Info Popup */}
                  {showCalculatorInfo && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div 
                        ref={calculatorInfoRef}
                        className="bg-gray-700 border border-gray-600 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-blue-300">Cálculo Automático Simplificado</h3>
                          </div>
                          <button
                            onClick={() => setShowCalculatorInfo(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="text-sm text-gray-200 space-y-3">
                          <p className="text-gray-300">
                            Ingresa los <strong>puntos totales</strong> y asigna <strong>goles a los jugadores</strong>. El sistema calculará automáticamente una estimación inteligente de victorias y empates.
                          </p>
                          
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-blue-400 font-medium mb-2">Algoritmo inteligente:</p>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">🧠</span>
                                <div>
                                  <p className="font-medium text-purple-300">Análisis de goles</p>
                                  <p className="text-gray-400">Calcula la proporción de goles de cada equipo</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                                <div>
                                  <p className="font-medium text-green-300">Victorias 2+ goles (3pts)</p>
                                  <p className="text-gray-400">Equipos con más goles tienen más victorias amplias</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                                <div>
                                  <p className="font-medium text-blue-300">Victorias normales (2pts)</p>
                                  <p className="text-gray-400">Distribuye puntos restantes en victorias ajustadas</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                                <div>
                                  <p className="font-medium text-yellow-300">Empates (1pt)</p>
                                  <p className="text-gray-400">Asigna puntos sobrantes como empates</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
                            <p className="text-blue-300 font-medium text-xs mb-1">💡 Consejo:</p>
                            <p className="text-xs text-blue-200">
                              Asigna goles realistas a los jugadores. El algoritmo usará esta información para hacer estimaciones más precisas de cómo se distribuyeron las victorias.
                            </p>
                          </div>

                          <p className="text-xs text-gray-400 italic">
                            * Esta es una estimación inteligente basada en puntos y goles. Puedes ajustar manualmente las estadísticas después del cálculo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Teams */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(createForm.teams) as Array<keyof typeof createForm.teams>).map((teamKey, index) => {
                  const team = createForm.teams[teamKey];
                  const teamNames = ["Equipo 1", "Equipo 2", "Equipo 3"] as const;
                  
                  return (
                    <div key={teamKey} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">{teamNames[index]} (Posición {index + 1})</h4>
                      
                      {/* Team Stats */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Puntos</label>
                          <input
                            type="number"
                            value={team.points}
                            onChange={(e) => updateTeamStats(teamKey, 'points', parseInt(e.target.value) || 0)}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Victorias</label>
                            <input
                              type="number"
                              value={team.wins}
                              onChange={(e) => updateTeamStats(teamKey, 'wins', parseInt(e.target.value) || 0)}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Empates</label>
                            <input
                              type="number"
                              value={team.draws}
                              onChange={(e) => updateTeamStats(teamKey, 'draws', parseInt(e.target.value) || 0)}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Players */}
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-2">
                          Jugadores ({team.players.length}/5)
                        </label>
                        <button
                          onClick={() => openPlayerSelector(teamKey)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm w-full mb-2 transition-colors"
                        >
                          Seleccionar Jugadores
                        </button>
                        <div className="space-y-1">
                          {team.players.map((playerId, playerIndex) => {
                            const player = availablePlayers.find(p => p.id === playerId);
                            return (
                              <div key={playerId} className="flex items-center justify-between bg-gray-600 rounded px-2 py-1">
                                <span className="text-sm text-white">{player?.name}</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Goles"
                                    value={createForm.scorers[playerId] || 0}
                                    onChange={(e) => updatePlayerGoals(playerId, parseInt(e.target.value) || 0)}
                                    className="bg-gray-500 border border-gray-400 rounded px-2 py-1 text-white w-16 text-xs focus:outline-none focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => removePlayerFromTeam(teamKey, playerIndex)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCreateTriangular}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Crear Triangular
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Selector Modal */}
      {showPlayerSelector && selectedTeamKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Seleccionar Jugadores para {selectedTeamKey === 'first' ? 'Equipo 1' : selectedTeamKey === 'second' ? 'Equipo 2' : 'Equipo 3'}
              </h3>
              <button
                onClick={closePlayerSelector}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm">
                Selecciona hasta 5 jugadores. Los jugadores en verde están seleccionados.
                Los jugadores en gris están asignados a otros equipos.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Jugadores seleccionados: {createForm.teams[selectedTeamKey].players.length}/5
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 justify-items-center">
              {getAvailablePlayersForSelector().map((player) => (
                <button
                  key={player.id}
                  onClick={() => !player.isDisabled && togglePlayerSelection(player.id)}
                  disabled={player.isDisabled || (!player.isSelected && createForm.teams[selectedTeamKey].players.length >= 5)}
                  className={`
                    w-20 h-20 rounded-full text-xs font-bold transition-all flex items-center justify-center px-2
                    border-2 
                    ${player.isSelected 
                      ? "bg-green-600 border-green-400 text-white" 
                      : player.isDisabled 
                        ? "bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
                        : createForm.teams[selectedTeamKey].players.length >= 5
                          ? "bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 border-gray-500 text-white hover:bg-gray-600 cursor-pointer"
                    }
                    ${!player.isDisabled && createForm.teams[selectedTeamKey].players.length < 5 ? "active:scale-95" : ""}
                  `}
                >
                  <span className="text-center leading-tight break-words max-w-full">
                    {player.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closePlayerSelector}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Confirmar Selección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-white">
                  Confirmar eliminación
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-300">
                ¿Estás seguro de que deseas eliminar <strong>{deleteConfirm.title}</strong>?
              </p>
              <p className="text-sm text-red-400 mt-2">
                Esta acción no se puede deshacer y recalculará las estadísticas de todos los jugadores.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <SoccerBallIcon className="animate-spin" width={20} height={20} />}
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Colors Tab */}
      {selectedTriangularId && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Editar Colores de Triangular</h2>
          <div className="mb-4">
            <label className="block mb-2">Seleccionar Triangular por Fecha:</label>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              value={selectedTriangularId || ''}
              onChange={e => handleSelectTriangular(e.target.value)}
            >
              <option value="">-- Selecciona un triangular --</option>
              {triangulars.map(t => (
                <option key={t.id} value={t.id}>{formatDate(t.date)}</option>
              ))}
            </select>
          </div>
          {selectedTriangularId && (
            <DndContext collisionDetection={closestCenter} onDragEnd={({active, over}) => {
              if (!over || active.id === over.id) return;
              setEditTeams(prev => {
                const newTeams = { ...prev };
                const fromPlayers = prev[active.id as Team];
                const toPlayers = prev[over.id as Team];
                // Actualizar el campo team de cada jugador
                const updatedFrom = toPlayers.map(p => ({ ...p, team: active.id as Team }));
                const updatedTo = fromPlayers.map(p => ({ ...p, team: over.id as Team }));
                newTeams[active.id as Team] = updatedFrom;
                newTeams[over.id as Team] = updatedTo;
                return newTeams;
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {(['Equipo 1', 'Equipo 2', 'Equipo 3'] as Team[]).map(team => {
                  const totalGoals = editTeams[team].reduce((sum, player) => sum + (player.goals ?? 0), 0);
                  return (
                    <div key={team} className={`${teamBgColors[team]} rounded-lg p-4 min-h-[200px] mb-2`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-center text-gray-900">{getColorByTeam(team)}</h3>
                        <span className="text-xs font-bold text-gray-900">{editTeamsTriangular?.teams.find(t => t.name === team)?.points ?? 0} pts</span>
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-2">Goles: {totalGoals}</div>
                      <DraggableTeamBox
                        key={team}
                        team={team}
                        players={editTeams[team]}
                        color={teamBgColors[team]}
                      />
                    </div>
                  );
                })}
              </div>
            </DndContext>
          )}
          {selectedTriangularId && (
            <button onClick={handleSaveEditColors} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium mt-4">
              {isSavingEditTeams && (
                <SoccerBallIcon className="animate-spin" width={20} height={20} />
              )}
              Guardar Cambios
            </button>
          )}
        </div>
      )}

      {/* Edit Teams Modal */}
      {showEditTeamsModal && editTeamsTriangular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col gap-2 mb-6">
              <span className="text-sm text-gray-300">Fecha: {formatDate(editTeamsTriangular.date)}</span>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Editar Equipos y Colores</h3>
                <button
                  onClick={() => setShowEditTeamsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={({active, over}) => {
              if (!over || active.id === over.id) return;
              setEditTeams(prev => {
                const newTeams = { ...prev };
                const fromPlayers = prev[active.id as Team];
                const toPlayers = prev[over.id as Team];
                // Actualizar el campo team de cada jugador
                const updatedFrom = toPlayers.map(p => ({ ...p, team: active.id as Team }));
                const updatedTo = fromPlayers.map(p => ({ ...p, team: over.id as Team }));
                newTeams[active.id as Team] = updatedFrom;
                newTeams[over.id as Team] = updatedTo;
                return newTeams;
              });
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {(['Equipo 1', 'Equipo 2', 'Equipo 3'] as Team[]).map(team => {
                  const totalGoals = editTeams[team].reduce((sum, player) => sum + (player.goals ?? 0), 0);
                  return (
                    <div key={team} className={`${teamBgColors[team]} rounded-lg p-4 min-h-[200px] mb-2`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-center text-gray-900">{getColorByTeam(team)}</h3>
                        <span className="text-xs font-bold text-gray-900">{editTeamsTriangular?.teams.find(t => t.name === team)?.points ?? 0} pts</span>
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-2">Goles: {totalGoals}</div>
                      <DraggableTeamBox
                        key={team}
                        team={team}
                        players={editTeams[team]}
                        color={teamBgColors[team]}
                      />
                    </div>
                  );
                })}
              </div>
            </DndContext>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveEditColors}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
              >
                {isSavingEditTeams && (
                  <SoccerBallIcon className="animate-spin" width={20} height={20} />
                )}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}