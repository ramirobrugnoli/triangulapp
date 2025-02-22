// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Añadir logs para todos los queries y errores
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Registrar eventos para debugging
prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

prisma.$on("error", (e) => {
  console.error("Prisma Error:", e);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Verificar la conexión al inicializar
async function testConnection() {
  try {
    console.log("Verificando conexión a la base de datos...");
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL?.substring(0, 20) + "..."
    );

    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conexión a la base de datos exitosa");

    // Verificar la estructura de la base de datos
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tablas disponibles:", tables);
  } catch (e) {
    console.error("❌ Error al conectar con la base de datos:", e);
  }
}

// En producción, ejecutar solo si es una API route
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_RUNTIME === "nodejs"
) {
  testConnection();
}
