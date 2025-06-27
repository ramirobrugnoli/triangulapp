import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreatePlayer from '@/components/players/CreatePlayer';

// Mock toast notifications
jest.mock('react-toastify', () => ({
  toast: jest.fn(),
  ToastContainer: () => null,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CreatePlayer', () => {
  const mockOnPlayerAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders the create player form', () => {
    render(<CreatePlayer />);
    
    expect(screen.getByRole('heading', { name: 'Agregar Jugador' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre del jugador')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar Jugador' })).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    expect(input).toHaveValue('Juan Pérez');
  });

  it('shows validation error when submitting empty name', async () => {
    const { toast } = require('react-toastify');
    render(<CreatePlayer />);
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    expect(toast).toHaveBeenCalledWith('El nombre es requerido');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows validation error when submitting only whitespace', async () => {
    const { toast } = require('react-toastify');
    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    expect(toast).toHaveBeenCalledWith('El nombre es requerido');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('successfully creates a player', async () => {
    const { toast } = require('react-toastify');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Juan Pérez' }),
    });

    render(<CreatePlayer onPlayerAdded={mockOnPlayerAdded} />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Agregando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Juan Pérez' }),
      });
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('Jugador Juan Pérez agregado correctamente ⚽');
      expect(mockOnPlayerAdded).toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  it('handles API error gracefully', async () => {
    const { toast } = require('react-toastify');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('Error al crear el jugador');
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles network error gracefully', async () => {
    const { toast } = require('react-toastify');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('Error al crear el jugador');
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('trims whitespace from player name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Juan Pérez' }),
    });

    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: '  Juan Pérez  ' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Juan Pérez' }),
      });
    });
  });

  it('disables form during submission', async () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Agregando...')).toBeInTheDocument();
  });

  it('works without onPlayerAdded callback', async () => {
    const { toast } = require('react-toastify');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Juan Pérez' }),
    });

    render(<CreatePlayer />);
    
    const input = screen.getByPlaceholderText('Nombre del jugador');
    fireEvent.change(input, { target: { value: 'Juan Pérez' } });
    
    const submitButton = screen.getByRole('button', { name: 'Agregar Jugador' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('Jugador Juan Pérez agregado correctamente ⚽');
    });
  });
}); 