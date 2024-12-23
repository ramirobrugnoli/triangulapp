import { GoalScorerModalProps } from "@/types";

export function GoalScorerModal({
  isOpen,
  team,
  players,
  onClose,
  onSelect,
}: GoalScorerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">
          Seleccionar Goleador - Equipo {team}
        </h3>
        <div className="space-y-2">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onSelect(player.id);
                onClose();
              }}
              className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left"
            >
              {player.name}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
