import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetIcon from '@/components/ui/icons/ResetIcon';

describe('ResetIcon Component', () => {
  it('should render with default props', () => {
    const { container } = render(<ResetIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should render with custom dimensions', () => {
    const { container } = render(<ResetIcon width={48} height={48} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('should apply custom className', () => {
    const { container } = render(<ResetIcon className="reset-icon" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('reset-icon');
  });

  it('should contain reset icon paths', () => {
    const { container } = render(<ResetIcon />);
    const paths = container.querySelectorAll('path');
    
    expect(paths).toHaveLength(4);
    expect(paths[0]).toHaveAttribute('d', 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8');
    expect(paths[1]).toHaveAttribute('d', 'M21 3v5h-5');
    expect(paths[2]).toHaveAttribute('d', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16');
    expect(paths[3]).toHaveAttribute('d', 'M3 21v-5h5');
  });

  it('should have proper stroke attributes', () => {
    const { container } = render(<ResetIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
  });
}); 