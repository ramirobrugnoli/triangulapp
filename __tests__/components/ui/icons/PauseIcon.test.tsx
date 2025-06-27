import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PauseIcon from '@/components/ui/icons/PauseIcon';

describe('PauseIcon Component', () => {
  it('should render with default props', () => {
    const { container } = render(<PauseIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should render with custom dimensions', () => {
    const { container } = render(<PauseIcon width={40} height={40} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });

  it('should apply custom className', () => {
    const { container } = render(<PauseIcon className="pause-icon" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('pause-icon');
  });

  it('should contain pause icon rectangles', () => {
    const { container } = render(<PauseIcon />);
    const rects = container.querySelectorAll('rect');
    
    expect(rects).toHaveLength(2);
    expect(rects[0]).toHaveAttribute('x', '6');
    expect(rects[0]).toHaveAttribute('y', '4');
    expect(rects[0]).toHaveAttribute('width', '4');
    expect(rects[0]).toHaveAttribute('height', '16');
    
    expect(rects[1]).toHaveAttribute('x', '14');
    expect(rects[1]).toHaveAttribute('y', '4');
    expect(rects[1]).toHaveAttribute('width', '4');
    expect(rects[1]).toHaveAttribute('height', '16');
  });

  it('should have proper stroke attributes', () => {
    const { container } = render(<PauseIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
  });
}); 