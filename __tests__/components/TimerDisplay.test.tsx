import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimerDisplay from '@/components/ui/TimerDisplay';

describe('TimerDisplay', () => {
  it('should render minutes and seconds correctly', () => {
    render(<TimerDisplay minutes={5} seconds={30} isPaused={true} />);
    
    expect(screen.getByText('05:30')).toBeInTheDocument();
  });

  it('should format single digit minutes and seconds with leading zeros', () => {
    render(<TimerDisplay minutes={1} seconds={5} isPaused={true} />);
    
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });


  it('should handle zero minutes and seconds', () => {
    render(<TimerDisplay minutes={0} seconds={0} isPaused={true} />);
    
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('should handle large minutes correctly', () => {
    render(<TimerDisplay minutes={99} seconds={59} isPaused={true} />);
    
    expect(screen.getByText('99:59')).toBeInTheDocument();
  });

  it('should apply correct styling when paused', () => {
    render(<TimerDisplay minutes={5} seconds={30} isPaused={true} />);
    
    const display = screen.getByText('05:30');
    expect(display).toHaveClass('text-red-600');
  });

  it('should apply correct styling when running', () => {
    render(<TimerDisplay minutes={5} seconds={30} isPaused={false} />);
    
    const display = screen.getByText('05:30');
    expect(display).toHaveClass('text-green-600');
  });
}); 