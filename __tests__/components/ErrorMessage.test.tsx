import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

describe('ErrorMessage Component', () => {
  it('should render error message with provided text', () => {
    const errorMessage = 'Test error message';
    const { getByText } = render(<ErrorMessage message={errorMessage} />);
    expect(getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render with proper error styling', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    expect(container.firstChild).toHaveClass('bg-red-900', 'text-red-200', 'rounded-lg');
  });
}); 