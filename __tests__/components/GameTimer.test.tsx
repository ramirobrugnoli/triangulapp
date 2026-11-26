import { render, screen, fireEvent, act, within } from '@testing-library/react';
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
    
    expect(within(screen.getByTestId('game-timer')).getByTitle('Reiniciar tiempo')).toBeInTheDocument();
    expect(within(screen.getByTestId('game-timer')).getByTitle('Continuar')).toBeInTheDocument();
  });

  it('calls toggleTimer when play/pause button is clicked', () => {
    render(<GameTimer />);
    
    const toggleButton = within(screen.getByTestId('game-timer')).getByTitle('Continuar');
    fireEvent.click(toggleButton);
    
    expect(mockToggleTimer).toHaveBeenCalled();
  });

  it('calls resetTimer when reset button is clicked', () => {
    render(<GameTimer />);
    
    const resetButton = within(screen.getByTestId('game-timer')).getByTitle('Reiniciar tiempo');
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
    
    expect(within(screen.getByTestId('game-timer')).getByTitle('Pausar')).toBeInTheDocument();
  });

  it('shows play icon when timer is not running', () => {
    render(<GameTimer />);
    
    expect(within(screen.getByTestId('game-timer')).getByTitle('Continuar')).toBeInTheDocument();
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
    
    const toggleButton = within(screen.getByTestId('game-timer')).getByTitle('Continuar');
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
    
    expect(within(screen.getByTestId('game-timer')).getByText('02:05')).toBeInTheDocument();
  });

  it('slides in a fixed compact bar once the timer scrolls off the top, without moving the page', () => {
    render(<GameTimer />);
    const timer = screen.getByTestId('game-timer');
    const compact = screen.getByTestId('game-timer-compact');
    const timerClasses = timer.className;

    // Oculta: fuera de pantalla e inerte
    expect(compact).toHaveAttribute('data-visible', 'false');
    expect(compact).toHaveClass('-translate-y-full', 'opacity-0');
    expect(compact).toHaveAttribute('inert');

    jest.spyOn(timer, 'getBoundingClientRect').mockReturnValue({ top: -20 } as DOMRect);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(compact).toHaveAttribute('data-visible', 'true');
    expect(compact).toHaveClass('fixed', 'top-0', 'translate-y-0', 'opacity-100');
    expect(compact).not.toHaveAttribute('inert');
    // El timer grande no cambia: la página no se acorta al compactar
    expect(timer.className).toBe(timerClasses);
    fireEvent.click(within(compact).getByTitle('Continuar'));
    expect(mockToggleTimer).toHaveBeenCalled();

    jest.spyOn(timer, 'getBoundingClientRect').mockReturnValue({ top: 120 } as DOMRect);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(compact).toHaveAttribute('data-visible', 'false');
  });
});
