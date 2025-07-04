import React from 'react';

interface SoccerBallIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const SoccerBallIcon: React.FC<SoccerBallIconProps> = ({ width = 24, height = 24, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="16" cy="16" r="16" fill="#fff" />
    <circle cx="16" cy="16" r="13" fill="#222" />
    <polygon points="16,8 20,12 16,16 12,12" fill="#fff" />
    <polygon points="16,24 20,20 16,16 12,20" fill="#fff" />
    <polygon points="8,16 12,20 16,16 12,12" fill="#fff" />
    <polygon points="24,16 20,20 16,16 20,12" fill="#fff" />
    <circle cx="16" cy="16" r="3" fill="#fff" />
  </svg>
);

export default SoccerBallIcon; 