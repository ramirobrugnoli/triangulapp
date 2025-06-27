import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies disabled state correctly', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'rounded-lg', 'bg-green-600');
  });

  it('works without onClick handler', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(button).toBeInTheDocument();
  });

  it('renders with complex children', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
}); 