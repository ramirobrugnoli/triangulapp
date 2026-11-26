import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TeamsBuilder } from "@/components/teamsbuilder/TeamsBuilder";
import { mockPlayers } from "@/store/mocks/stats";
import { toast } from "react-toastify";

// Router estable: el efecto de carga depende de él
const mockRouter = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("react-toastify", () => {
  const toastFn = Object.assign(jest.fn(), {
    warning: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  });
  return { toast: toastFn, ToastContainer: () => null };
});

const players = mockPlayers.slice(0, 7);

jest.mock("@/store/gameStore", () => ({
  useGameStore: () => ({ setTeams: jest.fn(), selectedPlayers: players }),
}));

jest.mock("@/store/seasonStore", () => ({
  useSeasonStore: () => ({
    getSelectedSeasonId: () => null,
    isAllSeasonsMode: () => true,
  }),
}));

jest.mock("@/lib/api", () => ({
  api: { players: { getPlayerStatsByIds: jest.fn().mockResolvedValue([]) } },
}));

jest.mock("@/lib/services/playerStats", () => ({
  PlayerStatsService: {
    calculatePlayersRatingsV2: jest.fn().mockReturnValue({}),
    calculatePlayerRatingV2: jest.fn().mockReturnValue(0),
  },
}));

const teamMoveButtons = () =>
  within(screen.getByRole("toolbar", { name: "Mover jugadores seleccionados" })).getAllByRole(
    "button",
    { name: /^→/ }
  );

describe("TeamsBuilder: búsqueda y selección múltiple", () => {
  beforeEach(() => jest.clearAllMocks());

  it("filtra los jugadores disponibles sin importar mayúsculas ni tildes", () => {
    render(<TeamsBuilder />);

    fireEvent.change(screen.getByLabelText("Buscar jugador"), { target: { value: "RÁM" } });

    expect(screen.getByText("Rama")).toBeInTheDocument();
    expect(screen.queryByText("Pasko")).not.toBeInTheDocument();
  });

  it("muestra un mensaje cuando la búsqueda no encuentra jugadores", () => {
    render(<TeamsBuilder />);

    fireEvent.change(screen.getByLabelText("Buscar jugador"), { target: { value: "zzz" } });

    expect(screen.getByText(/Ningún jugador coincide/)).toBeInTheDocument();
  });

  it("mueve varios jugadores seleccionados a un equipo de una sola vez", () => {
    render(<TeamsBuilder />);

    fireEvent.click(screen.getByText("Rama"));
    fireEvent.click(screen.getByText("Pasko"));
    expect(screen.getByText("2 seleccionados")).toBeInTheDocument();

    fireEvent.click(teamMoveButtons()[0]);

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    expect(screen.getByText("(2/5)")).toBeInTheDocument();
    expect(screen.getByText("Rama").closest("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("selecciona todos los resultados visibles de la búsqueda", () => {
    render(<TeamsBuilder />);

    fireEvent.change(screen.getByLabelText("Buscar jugador"), { target: { value: "a" } });
    const visibles = screen.getAllByRole("button", { pressed: false }).length;
    fireEvent.click(screen.getByText("Seleccionar visibles"));

    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(visibles);
  });

  it("respeta el cupo de 5 y deja seleccionados a los que no entraron", () => {
    render(<TeamsBuilder />);

    players.slice(0, 6).forEach((player) => fireEvent.click(screen.getByText(player.name)));
    fireEvent.click(teamMoveButtons()[0]);

    expect(toast.warning).toHaveBeenCalled();
    expect(screen.getByText("1 seleccionado")).toBeInTheDocument();
    expect(teamMoveButtons()[0]).toBeDisabled();
  });

  it("devuelve jugadores de un equipo a disponibles", () => {
    render(<TeamsBuilder />);

    fireEvent.click(screen.getByText("Rama"));
    fireEvent.click(teamMoveButtons()[1]);

    fireEvent.click(screen.getByText("Rama"));
    fireEvent.click(screen.getByText("Devolver a disponibles"));

    expect(screen.queryByText("(1/5)")).not.toBeInTheDocument();
    expect(screen.getAllByText("(0/5)")).toHaveLength(3);
  });

  it("intercambia dos jugadores de equipos distintos", () => {
    render(<TeamsBuilder />);

    fireEvent.click(screen.getByText("Rama"));
    fireEvent.click(teamMoveButtons()[0]);
    fireEvent.click(screen.getByText("Pasko"));
    fireEvent.click(teamMoveButtons()[1]);

    fireEvent.click(screen.getByText("Rama"));
    fireEvent.click(screen.getByText("Pasko"));
    fireEvent.click(screen.getByText("⇄ Intercambiar"));

    const amarillo = screen.getByRole("region", { name: "Amarillo" });
    const rosa = screen.getByRole("region", { name: "Rosa" });
    expect(within(amarillo).getByText("Pasko")).toBeInTheDocument();
    expect(within(rosa).getByText("Rama")).toBeInTheDocument();
  });

  it("ubica a los seleccionados tocando un lugar vacío del equipo", () => {
    render(<TeamsBuilder />);

    fireEvent.click(screen.getByText("Rama"));
    const negro = screen.getByRole("region", { name: "Negro" });
    fireEvent.click(within(negro).getAllByRole("button", { name: "Agregar aquí" })[0]);

    expect(within(negro).getByText("Rama")).toBeInTheDocument();
    expect(within(negro).getByText("(1/5)")).toBeInTheDocument();
  });

  it("no usa arrastre ni círculos", () => {
    const { container } = render(<TeamsBuilder />);

    expect(container.querySelector(".rounded-full.w-20")).toBeNull();
    expect(container.querySelector("[aria-roledescription='draggable']")).toBeNull();
  });
});
