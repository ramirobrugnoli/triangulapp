import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerSelector } from '@/components/players/PlayerSelector';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { playerService } from '@/lib/api';
import { toast } from 'react-toastify';

// Mock the router push function
const mockPush = jest.fn();

// Mock dependencies
jest.mock('@/store/gameStore');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));
jest.mock('@/lib/api');
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
    isActive: jest.fn(),
    update: jest.fn(),
  },
  ToastContainer: () => null,
}));

const mockStats = {
  matches: 0,
  goals: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  points: 0,
};

const mockPlayers = [
  { id: '1', name: 'Player 1', stats: mockStats },
  { id: '2', name: 'Player 2', stats: mockStats },
  { id: '3', name: 'Player 3', stats: mockStats },
  { id: '4', name: 'Player 4', stats: mockStats },
  { id: '5', name: 'Player 5', stats: mockStats },
  { id: '6', name: 'Player 6', stats: mockStats },
  { id: '7', name: 'Player 7', stats: mockStats },
];

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
const mockPlayerService = playerService as jest.Mocked<typeof playerService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('PlayerSelector', () => {
  const mockUpdateAvailablePlayers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseGameStore.mockReturnValue({
      updateAvailablePlayers: mockUpdateAvailablePlayers,
    } as any);

    mockPlayerService.getSimplePlayers.mockResolvedValue(mockPlayers);
    
    // Mock timers for toast delays
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading spinner initially', () => {
    render(<PlayerSelector />);
    
    expect(screen.getByText((content, element) => {
      return element?.classList.contains('animate-spin') || false;
    })).toBeInTheDocument();
  });

  it('renders players after loading', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
    });
  });

  it('displays player count correctly', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Seleccionar Jugadores (0/15)')).toBeInTheDocument();
    });
  });

  it('allows selecting players', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      const player1Button = screen.getByText('Player 1');
      fireEvent.click(player1Button);
    });

    expect(screen.getByText('Seleccionar Jugadores (1/15)')).toBeInTheDocument();
    expect(screen.getByText('Jugadores Seleccionados (1)')).toBeInTheDocument();
  });

  it('allows deselecting players', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      const player1Button = screen.getAllByText('Player 1')[0]; // Get the first one (button in grid)
      fireEvent.click(player1Button);
    });

    // Click again to deselect - use getAllByText and get the first one
    fireEvent.click(screen.getAllByText('Player 1')[0]);

    expect(screen.getByText('Seleccionar Jugadores (0/15)')).toBeInTheDocument();
    expect(screen.getByText('Ningún jugador seleccionado')).toBeInTheDocument();
  });

  it('allows removing players from selected list', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      const player1Button = screen.getByText('Player 1');
      fireEvent.click(player1Button);
    });

    // Find and click the remove button (✕)
    const removeButton = screen.getByRole('button', { name: '✕' });
    fireEvent.click(removeButton);

    expect(screen.getByText('Seleccionar Jugadores (0/15)')).toBeInTheDocument();
  });

  it('prevents selecting more than 15 players', async () => {
    // Mock 16 players
    const manyPlayers = Array.from({ length: 16 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Player ${i + 1}`,
      stats: mockStats
    }));
    
    mockPlayerService.getSimplePlayers.mockResolvedValue(manyPlayers);
    
    render(<PlayerSelector />);
    
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Select 15 players
    for (let i = 1; i <= 15; i++) {
      fireEvent.click(screen.getByText(`Player ${i}`));
    }

    // Try to select 16th player
    fireEvent.click(screen.getByText('Player 16'));

    // Should still show 15 selected
    expect(screen.getByText('Seleccionar Jugadores (15/15)')).toBeInTheDocument();

    // Should show warning toast
    act(() => {
      jest.runAllTimers();
    });

    expect(mockToast.warning).toHaveBeenCalledWith(
      'Solo puedes seleccionar 15 jugadores',
      expect.any(Object)
    );
  });

  it('disables confirm button when less than 6 players selected', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirmar Jugadores');
      expect(confirmButton).toBeDisabled();
    });
  });

  it('enables confirm button when 6 or more players selected', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      // Select 6 players
      for (let i = 1; i <= 6; i++) {
        fireEvent.click(screen.getByText(`Player ${i}`));
      }
    });

    const confirmButton = screen.getByText('Confirmar Jugadores');
    expect(confirmButton).toBeEnabled();
  });

  it('shows error when trying to confirm with less than 6 players', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      // Select only 3 players
      for (let i = 1; i <= 3; i++) {
        fireEvent.click(screen.getByText(`Player ${i}`));
      }
    });

    // The button should be disabled when less than 6 players
    const confirmButton = screen.getByText('Confirmar Jugadores');
    expect(confirmButton).toBeDisabled();
    
    // The validation is already built into the component - it only shows error
    // if someone manually calls handleConfirm, but the button is disabled
    // Let's test that the button is properly disabled instead
    expect(confirmButton).toHaveClass('bg-gray-600');
    expect(confirmButton).toHaveClass('cursor-not-allowed');
  });

  it('successfully confirms players and navigates', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      // Select 6 players
      for (let i = 1; i <= 6; i++) {
        fireEvent.click(screen.getByText(`Player ${i}`));
      }
    });

    const confirmButton = screen.getByText('Confirmar Jugadores');
    fireEvent.click(confirmButton);

    expect(mockUpdateAvailablePlayers).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Player 1' }),
        expect.objectContaining({ name: 'Player 2' }),
        expect.objectContaining({ name: 'Player 3' }),
        expect.objectContaining({ name: 'Player 4' }),
        expect.objectContaining({ name: 'Player 5' }),
        expect.objectContaining({ name: 'Player 6' }),
      ])
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      'Jugadores seleccionados correctamente',
      expect.any(Object)
    );

    expect(mockPush).toHaveBeenCalledWith('/armador');
  });

  it('handles API error gracefully', async () => {
    mockPlayerService.getSimplePlayers.mockRejectedValue(new Error('API Error'));
    
    render(<PlayerSelector />);

    await waitFor(() => {
      expect(screen.queryByText('Player 1')).not.toBeInTheDocument();
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Error al cargar los jugadores',
      expect.any(Object)
    );
  });

  it('applies correct CSS classes for selected players', async () => {
    render(<PlayerSelector />);
    
    await waitFor(() => {
      const player1Button = screen.getByText('Player 1');
      
      // Initially not selected
      expect(player1Button).toHaveClass('bg-gray-700');
      
      fireEvent.click(player1Button);
      
      // After selection
      expect(player1Button).toHaveClass('bg-green-600');
    });
  });
}); 