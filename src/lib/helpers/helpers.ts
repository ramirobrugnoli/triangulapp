export const getColorByTeam = (team: "Equipo 1" | "Equipo 2" | "Equipo 3") => {
  switch (team) {
    case "Equipo 1":
      return "Amarillo";
    case "Equipo 2":
      return "Rosa";
    case "Equipo 3":
      return "Negro";
    default:
      return "";
  }
};

// Normaliza texto para búsquedas: sin mayúsculas, tildes ni espacios en los bordes
export const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
