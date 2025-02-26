import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    // Orden importante para respetar las restricciones de clave foránea
    console.log("Eliminando datos...");

    // Primero eliminar tablas con claves foráneas
    await prisma.playerTriangular.deleteMany({});
    await prisma.teamResult.deleteMany({});

    // Luego eliminar tablas principales
    await prisma.triangular.deleteMany({});
    await prisma.player.deleteMany({});

    console.log("Base de datos reiniciada correctamente");

    // Opcional: Ejecutar el seed nuevamente
    console.log("Ejecutando seed...");
    // Aquí puedes importar y ejecutar tu función de seed
  } catch (error) {
    console.error("Error al reiniciar la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
