import { render, screen, fireEvent } from '@testing-library/react';
import { GameTimer } from '@/components/game/GameTimer';
import { useGameStore } from '@/store/gameStore';
import { useTimerSocket } from '@/hooks/useTimerSocket';

// Import testing-library functions properly
import '@testing-library/jest-dom';

jest.mock('@/store/gameStore');
jest.mock('@/hooks/useTimerSocket');

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
const mockUseTimerSocket = useTimerSocket as jest.MockedFunction<typeof useTimerSocket>;

describe('GameTimer', () => {
  const mockHandleTimeUp = jest.fn();
  const mockPlayWhistle = jest.fn();
  const mockStartTimer = jest.fn();
  const mockStopTimer = jest.fn();
  const mockResetTimer = jest.fn();
  const mockResetWhistle = jest.fn();
  const mockToggleTimer = jest.fn();
  
  const defaultStoreState = {
    handleTimeUp: mockHandleTimeUp,
    playWhistle: mockPlayWhistle,
    setSocketResetFunction: jest.fn(),
  };

  const defaultTimerSocketState = {
    timerState: {
      timeLeft: 480,
      isRunning: false,
      whistleHasPlayed: false,
      gameId: 'current-match'
    },
    isConnected: true,
    startTimer: mockStartTimer,
    stopTimer: mockStopTimer,
    resetTimer: mockResetTimer,
    resetWhistle: mockResetWhistle,
    toggleTimer: mockToggleTimer,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockReturnValue(defaultStoreState);
    mockUseTimerSocket.mockReturnValue(defaultTimerSocketState);
  });

  it('renders correctly with initial state', () => {
    render(<GameTimer />);
    
    expect(screen.getByTitle('Reiniciar tiempo')).toBeInTheDocument();
    expect(screen.getByTitle('Continuar')).toBeInTheDocument();
  });

  it('calls useTimerSocket with correct parameters', () => {
    render(<GameTimer />);
    
    expect(mockUseTimerSocket).toHaveBeenCalledWith({
      gameId: 'current-match',
      onTimeUp: mockHandleTimeUp,
      onWhistle: mockPlayWhistle
    });
  });

  it('calls toggleTimer when play/pause button is clicked', () => {
    render(<GameTimer />);
    
    const toggleButton = screen.getByTitle('Continuar');
    fireEvent.click(toggleButton);
    
    expect(mockToggleTimer).toHaveBeenCalled();
  });

  it('calls resetTimer when reset button is clicked', () => {
    render(<GameTimer />);
    
    const resetButton = screen.getByTitle('Reiniciar tiempo');
    fireEvent.click(resetButton);
    
    expect(mockResetTimer).toHaveBeenCalled();
  });

  it('shows pause icon when timer is running', () => {
    mockUseTimerSocket.mockReturnValue({
      ...defaultTimerSocketState,
      timerState: {
        timeLeft: 480,
        isRunning: true,
        whistleHasPlayed: false,
        gameId: 'current-match'
      },
    });

    render(<GameTimer />);
    
    expect(screen.getByTitle('Pausar')).toBeInTheDocument();
  });

  it('shows play icon when timer is not running', () => {
    render(<GameTimer />);
    
    expect(screen.getByTitle('Continuar')).toBeInTheDocument();
  });

  it('shows connection status indicator', () => {
    render(<GameTimer />);
    
    const connectionIndicator = screen.getByTitle('Conectado al servidor');
    expect(connectionIndicator).toBeInTheDocument();
    expect(connectionIndicator).toHaveClass('bg-green-500');
  });

  it('shows disconnected status when not connected', () => {
    mockUseTimerSocket.mockReturnValue({
      ...defaultTimerSocketState,
      isConnected: false,
    });

    render(<GameTimer />);
    
    const connectionIndicator = screen.getByTitle('Desconectado del servidor');
    expect(connectionIndicator).toBeInTheDocument();
    expect(connectionIndicator).toHaveClass('bg-red-500');
  });

  it('disables toggle button when time is 0', () => {
    mockUseTimerSocket.mockReturnValue({
      ...defaultTimerSocketState,
      timerState: {
        timeLeft: 0,
        isRunning: false,
        whistleHasPlayed: false,
        gameId: 'current-match'
      },
    });

    render(<GameTimer />);
    
    const toggleButton = screen.getByTitle('Continuar');
    expect(toggleButton).toBeDisabled();
  });
}); 