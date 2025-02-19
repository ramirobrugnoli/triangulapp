import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Lista de jugadores con estadísticas iniciales en 0
  const players = [
    "rama",
    "pasko",
    "kbz",
    "giando",
    "tomi",
    "cuistone",
    "cufa",
    "matibc",
    "luky",
    "agusgue",
    "matisabale",
    "nacho",
    "panchoanto",
    "kevin",
    "mateo",
  ];

  for (const playerName of players) {
    await prisma.player.create({
      data: {
        name: playerName,
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      },
    });
  }

  console.log(`Se agregaron ${players.length} jugadores a la base de datos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
