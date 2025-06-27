import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container).toBeInTheDocument();
  });

  it('should render spinner animation', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('rounded-full', 'border-green-500');
  });
}); 