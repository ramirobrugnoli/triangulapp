import { render, screen, fireEvent, act } from '@testing-library/react';
import { GameTimer } from '@/components/game/GameTimer';
import { useGameStore } from '@/store/gameStore';

// Import testing-library functions properly
import '@testing-library/jest-dom';

jest.mock('@/store/gameStore');

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;

describe('GameTimer', () => {
  const mockToggleTimer = jest.fn();
  const mockResetTimer = jest.fn();
  
  const defaultStoreState = {
    timer: {
      timeLeft: 480,
      isRunning: false,
      whistleHasPlayed: false,
      MATCH_DURATION: 420,
      onTimeUpCallback: null,
      startTime: null,
      timerInterval: null,
    },
    toggleTimer: mockToggleTimer,
    resetTimer: mockResetTimer,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockReturnValue(defaultStoreState);
  });

  it('renders correctly with initial state', () => {
    render(<GameTimer />);
    
    expect(screen.getByTitle('Reiniciar tiempo')).toBeInTheDocument();
    expect(screen.getByTitle('Continuar')).toBeInTheDocument();
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
    mockUseGameStore.mockReturnValue({
      ...defaultStoreState,
      timer: {
        ...defaultStoreState.timer,
        isRunning: true,
      },
    });

    render(<GameTimer />);
    
    expect(screen.getByTitle('Pausar')).toBeInTheDocument();
  });

  it('shows play icon when timer is not running', () => {
    render(<GameTimer />);
    
    expect(screen.getByTitle('Continuar')).toBeInTheDocument();
  });

  it('disables toggle button when time is 0', () => {
    mockUseGameStore.mockReturnValue({
      ...defaultStoreState,
      timer: {
        ...defaultStoreState.timer,
        timeLeft: 0,
      },
    });

    render(<GameTimer />);
    
    const toggleButton = screen.getByTitle('Continuar');
    expect(toggleButton).toBeDisabled();
  });

  it('displays correct time format', () => {
    mockUseGameStore.mockReturnValue({
      ...defaultStoreState,
      timer: {
        ...defaultStoreState.timer,
        timeLeft: 125, // 2 minutes and 5 seconds
      },
    });

    render(<GameTimer />);
    
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('stays sticky and switches to compact mode once scrolled past', () => {
    render(<GameTimer />);
    const timer = screen.getByTestId('game-timer');

    expect(timer).toHaveClass('sticky', 'top-0');
    expect(timer).toHaveAttribute('data-compact', 'false');

    jest.spyOn(timer, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect);
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(timer).toHaveAttribute('data-compact', 'true');

    jest.spyOn(timer, 'getBoundingClientRect').mockReturnValue({ top: 120 } as DOMRect);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(timer).toHaveAttribute('data-compact', 'false');
  });
});
