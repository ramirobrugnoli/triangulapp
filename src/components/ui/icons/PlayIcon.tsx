import React from 'react';

interface PlayIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const PlayIcon: React.FC<PlayIconProps> = ({ 
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
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
};

export default PlayIcon; 