import React from 'react';

interface PauseIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const PauseIcon: React.FC<PauseIconProps> = ({ 
  width = 24, 
  height = 24, 
  className = '' 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
};

export default PauseIcon; 