import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavBar } from '@/components/navigation/NavBar';
import { useGameStore } from '@/store/gameStore';

jest.mock('@/store/gameStore');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
const mockUsePathname = require('next/navigation').usePathname as jest.Mock;

describe('NavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStore.mockReturnValue({
      activeTeams: null,
    } as any);
  });

  it('renders all navigation links', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<NavBar />);
    
    expect(screen.getByText('Estadísticas')).toBeInTheDocument();
    expect(screen.getByText('Gráficos')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
    expect(screen.getByText('Armador')).toBeInTheDocument();
    expect(screen.getByText('Jugadores')).toBeInTheDocument();
  });

  it('highlights active link when on estadisticas page', () => {
    mockUsePathname.mockReturnValue('/estadisticas');
    
    render(<NavBar />);
    
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    const graficosLink = screen.getByText('Gráficos').closest('a');
    
    expect(estadisticasLink).toHaveClass('text-green-500');
    expect(graficosLink).toHaveClass('text-gray-400');
  });

  it('highlights active link when on graficos page', () => {
    mockUsePathname.mockReturnValue('/graficos');
    
    render(<NavBar />);
    
    const graficosLink = screen.getByText('Gráficos').closest('a');
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    
    expect(graficosLink).toHaveClass('text-green-500');
    expect(estadisticasLink).toHaveClass('text-gray-400');
  });

  it('highlights active link when on historial page', () => {
    mockUsePathname.mockReturnValue('/historial');
    
    render(<NavBar />);
    
    const historialLink = screen.getByText('Historial').closest('a');
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    
    expect(historialLink).toHaveClass('text-green-500');
    expect(estadisticasLink).toHaveClass('text-gray-400');
  });

  it('highlights active link when on armador page', () => {
    mockUsePathname.mockReturnValue('/armador');
    
    render(<NavBar />);
    
    const armadorLink = screen.getByText('Armador').closest('a');
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    
    expect(armadorLink).toHaveClass('text-green-500');
    expect(estadisticasLink).toHaveClass('text-gray-400');
  });

  it('highlights active link when on jugadores page', () => {
    mockUsePathname.mockReturnValue('/jugadores');
    
    render(<NavBar />);
    
    const jugadoresLink = screen.getByText('Jugadores').closest('a');
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    
    expect(jugadoresLink).toHaveClass('text-green-500');
    expect(estadisticasLink).toHaveClass('text-gray-400');
  });

  it('does not show anotador link when no active teams', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseGameStore.mockReturnValue({
      activeTeams: null,
    } as any);
    
    render(<NavBar />);
    
    expect(screen.queryByText('Anotador')).not.toBeInTheDocument();
  });

  it('shows anotador link when active teams exist', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseGameStore.mockReturnValue({
      activeTeams: {
        waiting: {
          members: [{ id: '1', name: 'Player 1' }],
        },
      },
    } as any);
    
    render(<NavBar />);
    
    expect(screen.getByText('Anotador')).toBeInTheDocument();
  });

  it('highlights anotador link when on anotador page', () => {
    mockUsePathname.mockReturnValue('/anotador');
    mockUseGameStore.mockReturnValue({
      activeTeams: {
        waiting: {
          members: [{ id: '1', name: 'Player 1' }],
        },
      },
    } as any);
    
    render(<NavBar />);
    
    const anotadorLink = screen.getByText('Anotador').closest('a');
    const estadisticasLink = screen.getByText('Estadísticas').closest('a');
    
    expect(anotadorLink).toHaveClass('text-green-500');
    expect(estadisticasLink).toHaveClass('text-gray-400');
  });

  it('renders correct href attributes for all links', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<NavBar />);
    
    expect(screen.getByText('Estadísticas').closest('a')).toHaveAttribute('href', '/estadisticas');
    expect(screen.getByText('Gráficos').closest('a')).toHaveAttribute('href', '/graficos');
    expect(screen.getByText('Historial').closest('a')).toHaveAttribute('href', '/historial');
    expect(screen.getByText('Armador').closest('a')).toHaveAttribute('href', '/armador');
    expect(screen.getByText('Jugadores').closest('a')).toHaveAttribute('href', '/jugadores');
  });
}); 