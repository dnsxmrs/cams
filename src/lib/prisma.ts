import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({
    connectionString,
});

// If dev server global instance is stale (e.g. generated after server startup), force fresh instantiation
const existingPrisma = globalForPrisma.prisma;
const isStale = existingPrisma && !("studentAuditLog" in existingPrisma);

export const prisma =
    (!isStale ? existingPrisma : undefined) ??
    new PrismaClient({
        adapter,
        // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

