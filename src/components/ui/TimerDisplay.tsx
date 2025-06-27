import React from 'react';

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  className?: string;
  isPaused?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  minutes, 
  seconds, 
  className = '', 
  isPaused = false,
}) => {
  // Formatear minutos y segundos con padding
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  // Determinar color basado en el estado
  const getColorClass = () => {
    return isPaused ? 'text-red-600' : 'text-green-600';
  };

  return (
    <>
      <div className={`text-8xl font-black rounded-lg px-8 py-5 text-center flex-1 digital-font tracking-widest ${getColorClass()} ${className}`}>
        {displayMinutes}:{displaySeconds}
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'Digital-7';
          src: url('/assets/fonts/digital-7.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        .digital-font {
          font-family: 'Digital-7', 'Courier New', monospace;
        }
      `}</style>
    </>
  );
};

export default TimerDisplay; 