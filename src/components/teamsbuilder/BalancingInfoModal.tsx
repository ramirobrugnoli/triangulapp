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
    <div className="pt-32 fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full text-white">
        <h2 className="text-lg font-bold mb-4">¿Cómo funciona el balanceo con IA?</h2>
        <div className="space-y-3 text-gray-300 text-sm">
          <p>
            El sistema de balanceo utiliza el nuevo <b>&quot;Rating V2&quot;</b> de cada jugador para distribuir a los jugadores de la forma más equitativa posible. El Rating V2 se calcula con la siguiente fórmula simplificada:
          </p>
          <p className="text-center font-mono bg-gray-900 p-2 rounded-md text-xs">
            (% Victorias × 0.6) + (% Triangulares Ganados × 0.4)
          </p>
          <p>Los componentes del Rating V2 son:</p>
          <ul className="list-disc list-inside pl-4 space-y-2">
            <li>
              <b>Porcentaje de Victorias (60%):</b> El porcentaje de partidos ganados del total de partidos jugados.
            </li>
            <li>
              <b>Porcentaje de Triangulares Ganados (40%):</b> El porcentaje de torneos triangulares que el jugador ha ganado.
            </li>
          </ul>
          <div className="bg-blue-900 p-3 rounded-md">
            <p className="text-blue-200 font-semibold">🎯 Ventajas del Rating V2:</p>
            <ul className="list-disc list-inside pl-4 space-y-1 text-blue-100 text-xs">
              <li>Más simple y fácil de entender</li>
              <li>Enfoque en resultados finales (victorias y campeonatos)</li>
              <li>Penaliza jugadores inconsistentes en triangulares</li>
              <li>Escala de 0-100 más intuitiva</li>
            </ul>
          </div>
          <p>
            El algoritmo de balanceo sigue un enfoque voraz (greedy) para distribuir a los jugadores:
          </p>
          <ul className="list-decimal list-inside pl-4 space-y-2 bg-gray-900 p-3 rounded-md">
            <li>
              <b>Ordenar Jugadores:</b> Primero, se ordena a todos los jugadores de mayor a menor según su &quot;Rating V2&quot;.
            </li>
            <li>
              <b>Asignación Iterativa:</b> Luego, se recorre la lista de jugadores uno por uno y se asigna cada jugador al equipo que, en ese momento, tenga la suma de ratings V2 más baja.
            </li>
          </ul>
           <p>
            Este método busca la mejor opción local en cada paso para llegar a una solución global muy equilibrada de forma rápida y eficiente.
          </p>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}; 