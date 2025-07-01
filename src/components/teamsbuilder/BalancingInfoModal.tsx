import React from 'react';

interface BalancingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BalancingInfoModal: React.FC<BalancingInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full text-white">
        <h2 className="text-xl font-bold mb-4">¿Cómo funciona el balanceo con IA?</h2>
        <div className="space-y-4 text-gray-300">
          <p>
            El sistema de balanceo utiliza el &quot;rating&quot; de cada jugador para distribuir a los jugadores de la forma más equitativa posible. El rating se calcula con la siguiente fórmula:
          </p>
          <p className="text-center font-mono bg-gray-900 p-2 rounded-md text-sm">
            (Puntos × 0.4) + (% Victorias × 0.35) + (Goles/Partido × 25)
          </p>
          <p>Los componentes del rating son:</p>
          <ul className="list-disc list-inside pl-4 space-y-2">
            <li>
              <b>Puntos Totales:</b> Suma de puntos por victorias/empates y puntos extra por la posición final en triangulares.
            </li>
            <li>
              <b>Porcentaje de Victorias:</b> El porcentaje de partidos ganados del total.
            </li>
            <li>
              <b>Goles por Partido:</b> El promedio de goles que un jugador anota por partido.
            </li>
          </ul>
          <p>
            El algoritmo de balanceo sigue un enfoque voraz (greedy) para distribuir a los jugadores:
          </p>
          <ul className="list-decimal list-inside pl-4 space-y-2 bg-gray-900 p-3 rounded-md">
            <li>
              <b>Ordenar Jugadores:</b> Primero, se ordena a todos los jugadores de mayor a menor según su &quot;rating&quot;.
            </li>
            <li>
              <b>Asignación Iterativa:</b> Luego, se recorre la lista de jugadores uno por uno y se asigna cada jugador al equipo que, en ese momento, tenga la suma de ratings más baja.
            </li>
          </ul>
           <p>
            Este método busca la mejor opción local en cada paso para llegar a una solución global muy equilibrada de forma rápida y eficiente.
          </p>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}; 