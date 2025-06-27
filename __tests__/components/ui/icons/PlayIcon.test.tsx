import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayIcon from '@/components/ui/icons/PlayIcon';

describe('PlayIcon Component', () => {
  it('should render with default props', () => {
    const { container } = render(<PlayIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should render with custom dimensions', () => {
    const { container } = render(<PlayIcon width={32} height={32} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('should apply custom className', () => {
    const { container } = render(<PlayIcon className="custom-class" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('custom-class');
  });

  it('should contain play icon polygon', () => {
    const { container } = render(<PlayIcon />);
    const polygon = container.querySelector('polygon');
    
    expect(polygon).toBeInTheDocument();
    expect(polygon).toHaveAttribute('points', '5,3 19,12 5,21');
  });

  it('should have proper stroke attributes', () => {
    const { container } = render(<PlayIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
  });
}); 