import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../src/app/admin/page';
import { api } from '../src/lib/api';

// Mock the API
jest.mock('../src/lib/api', () => ({
  api: {
    triangular: {
      getAllTriangulars: jest.fn(),
      updateTriangular: jest.fn(),
      deleteTriangular: jest.fn(),
    },
  },
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => null,
}));

// Mock getColorByTeam
jest.mock('../src/lib/helpers/helpers', () => ({
  getColorByTeam: jest.fn((team: string) => {
    const colors = {
      'Equipo 1': 'Amarillo',
      'Equipo 2': 'Rosa',
      'Equipo 3': 'Negro',
    };
    return colors[team as keyof typeof colors] || team;
  }),
}));

const mockTriangulars = [
  {
    id: 'triangular-1',
    date: '2023-12-01T10:00:00Z',
    champion: 'Equipo 1',
    teams: [
      { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
      { name: 'Equipo 2', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
      { name: 'Equipo 3', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 },
    ],
    scorers: [
      { name: 'Juan', goals: 3, team: 'Equipo 1' },
      { name: 'Pedro', goals: 2, team: 'Equipo 1' },
      { name: 'Ana', goals: 1, team: 'Equipo 2' },
    ],
  },
  {
    id: 'triangular-2',
    date: '2023-12-02T15:30:00Z',
    champion: 'Equipo 2',
    teams: [
      { name: 'Equipo 2', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 },
      { name: 'Equipo 3', points: 3, position: 2, wins: 1, normalWins: 0, draws: 0 },
      { name: 'Equipo 1', points: 0, position: 3, wins: 0, normalWins: 0, draws: 0 },
    ],
    scorers: [
      { name: 'Ana', goals: 4, team: 'Equipo 2' },
      { name: 'Luis', goals: 2, team: 'Equipo 3' },
    ],
  },
];

describe('AdminPage', () => {
  beforeEach(() => {
    (api.triangular.getAllTriangulars as jest.Mock).mockClear();
    (api.triangular.updateTriangular as jest.Mock).mockClear();
    (api.triangular.deleteTriangular as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<AdminPage />);
    
    expect(screen.getByText('Cargando triangulares...')).toBeInTheDocument();
  });

  it('renders triangulars list after loading', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Total triangulares
    expect(screen.getByText('triangular-1'.substring(0, 8) + '...')).toBeInTheDocument();
    expect(screen.getByText('triangular-2'.substring(0, 8) + '...')).toBeInTheDocument();
  });

  it('displays triangular details correctly', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Amarillo')).toBeInTheDocument(); // Champion of first triangular
    });

    expect(screen.getByText('Rosa')).toBeInTheDocument(); // Champion of second triangular
    expect(screen.getAllByText('Juan (3⚽)')).toHaveLength(1);
    expect(screen.getAllByText('Ana (4⚽)')).toHaveLength(1);
  });

  it('enters edit mode when edit button is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Editar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Editar')[0]);

    expect(screen.getByDisplayValue('Equipo 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023-12-01')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Editar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Editar')[0]);
    expect(screen.getByText('Guardar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
    expect(screen.getAllByText('Editar')).toHaveLength(2);
  });

  it('saves changes when save button is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    (api.triangular.updateTriangular as jest.Mock).mockResolvedValue({});
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Editar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Editar')[0]);
    
    const championSelect = screen.getByDisplayValue('Equipo 1');
    fireEvent.change(championSelect, { target: { value: 'Equipo 2' } });
    
    const dateInput = screen.getByDisplayValue('2023-12-01');
    fireEvent.change(dateInput, { target: { value: '2023-12-05' } });

    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(api.triangular.updateTriangular).toHaveBeenCalledWith('triangular-1', {
        champion: 'Equipo 2',
        date: '2023-12-05',
      });
    });
  });

  it('shows delete confirmation modal when delete button is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);

    expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument();
    expect(screen.getByText(/Triangular del/)).toBeInTheDocument();
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
  });

  it('cancels delete when cancel button in modal is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Cancelar')[0]);
    expect(screen.queryByText('Confirmar eliminación')).not.toBeInTheDocument();
  });

  it('deletes triangular when confirm delete is clicked', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    (api.triangular.deleteTriangular as jest.Mock).mockResolvedValue({});
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    
    fireEvent.click(screen.getAllByText('Eliminar')[1]); // The confirm button in modal

    await waitFor(() => {
      expect(api.triangular.deleteTriangular).toHaveBeenCalledWith('triangular-1');
    });
  });

  it('handles API errors gracefully', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });

    // Should show empty state when error occurs
    expect(screen.getByText('No hay triangulares registrados')).toBeInTheDocument();
  });

  it('displays empty state when no triangulars exist', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue([]);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    });

    expect(screen.getByText('No hay triangulares registrados')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Total triangulares
  });

  it('displays correct statistics in header cards', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total triangulares
    });

    expect(screen.getByText('1 de diciembre de 2023')).toBeInTheDocument(); // Last triangular date
    expect(screen.getByText('Amarillo')).toBeInTheDocument(); // Most frequent champion (first one)
  });

  it('formats dates correctly', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/1 de diciembre de 2023/)).toBeInTheDocument();
      expect(screen.getByText(/2 de diciembre de 2023/)).toBeInTheDocument();
    });
  });

  it('shows correct podium information', async () => {
    (api.triangular.getAllTriangulars as jest.Mock).mockResolvedValue(mockTriangulars);
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('1° Amarillo')).toBeInTheDocument();
      expect(screen.getByText('2° Rosa')).toBeInTheDocument();
      expect(screen.getByText('3° Negro')).toBeInTheDocument();
    });
  });
}); 