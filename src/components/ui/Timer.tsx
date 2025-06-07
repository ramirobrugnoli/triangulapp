'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  className?: string;
  initialMinutes?: number;
  onTimeUp?: () => void;
  onToggle?: () => void;
  onReset?: () => void;
}

const Timer: React.FC<TimerProps> = ({ className = '', initialMinutes = 7, onTimeUp, onToggle, onReset }) => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  const handleReset = () => {
    const newTotalSeconds = initialMinutes * 60;
    setTotalSeconds(newTotalSeconds);
    onReset?.();
  };

  useEffect(() => {
    setTotalSeconds(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (totalSeconds <= 0) {
      onTimeUp?.();
      return;
    }

    if (!isActive) {
      return;
    }

    const interval = setInterval(() => {
      setTotalSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds, onTimeUp, isActive]);

  const handleToggle = () => {
    setIsActive(!isActive);
    onToggle?.();
  };

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;


  return (
    <div className={`w-full font-sans ${className} bg-gray-900 rounded-lg`}>
      <div className="relative flex items-center justify-center w-full">
        {onReset && (
          <button 
            className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50" 
            onClick={handleReset} 
            title="Reiniciar tiempo"
          >
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
          </button>
        )}
        
        <div className="text-8xl font-black text-green-600 rounded-lg px-8 py-5 text-center flex-1 digital-font tracking-widest">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {onToggle && (
          <button 
            className="absolute right-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50" 
            onClick={handleToggle} 
            title={isActive ? "Pausar" : "Continuar"}
          >
            {isActive ? (
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
        )}
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
    </div>
  );
};

export default Timer; 