import { StatMetric } from "@/types/stats";

interface PlayersCountSelectorProps {
  metric: StatMetric;
  totalPlayers: number;
  currentValue: number;
  onChange: (metric: StatMetric, value: number) => void;
}

export function PlayersCountSelector({ 
  metric, 
  totalPlayers,
  currentValue,
  onChange
}: PlayersCountSelectorProps) {
  // Opciones para el selector (desde 3 hasta el total de jugadores)
  const options = Array.from(
    { length: Math.max(totalPlayers - 2, 1) }, 
    (_, i) => i + 3
  );
  
  return (
    <div className="flex items-center justify-end space-x-2">
      <label className="text-sm text-gray-300">Mostrar:</label>
      <select 
        value={currentValue}
        onChange={(e) => onChange(metric, Number(e.target.value))}
        className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1 border-none focus:ring-2 focus:ring-green-500"
      >
        {options.map(num => (
          <option key={num} value={num}>
            {num} jugadores
          </option>
        ))}
        <option value={totalPlayers}>Todos</option>
      </select>
    </div>
  );
} 