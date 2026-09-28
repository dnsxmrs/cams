import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({
  connectionString,
});

const SOFT_DELETE_MODELS = new Set([
  "Student",
  "Subject",
  "Enrollment",
  "AttendanceSession",
  "AttendanceRecord",
]);

const SOFT_DELETE_RELATIONS = new Set([
  "subjects",
  "student",
  "students",
  "subject",
  "enrollments",
  "sessions",
  "attendances",
  "records",
  "session",
]);

function applySoftDeleteToRelations(args: Record<string, any>) {
  if (!args || typeof args !== "object") return;

  for (const targetKey of ["include", "select"]) {
    if (args[targetKey] && typeof args[targetKey] === "object") {
      for (const [key, value] of Object.entries(args[targetKey])) {
        if (SOFT_DELETE_RELATIONS.has(key)) {
          if (value === true) {
            args[targetKey][key] = { where: { deletedAt: null } };
          } else if (value && typeof value === "object") {
            const valObj = value as Record<string, any>;
            valObj.where = valObj.where ? { ...valObj.where, deletedAt: null } : { deletedAt: null };
            applySoftDeleteToRelations(valObj);
          }
        } else if (value && typeof value === "object") {
          applySoftDeleteToRelations(value as Record<string, any>);
        }
      }
    }
  }
}

function uncapitalize(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function createPrismaClient() {
  const baseClient = new PrismaClient({
    adapter,
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          const modelArgs = (args || {}) as Record<string, any>;

          // Convert hard delete to soft delete
          if (operation === "delete") {
            return (baseClient as any)[uncapitalize(model)].update({
              where: modelArgs.where,
              data: { deletedAt: new Date() },
            });
          }

          if (operation === "deleteMany") {
            return (baseClient as any)[uncapitalize(model)].updateMany({
              where: modelArgs.where ? { ...modelArgs.where, deletedAt: null } : { deletedAt: null },
              data: { deletedAt: new Date() },
            });
          }

          // Enforce deletedAt: null on read operations
          if (
            [
              "findMany",
              "findFirst",
              "findUnique",
              "findFirstOrThrow",
              "findUniqueOrThrow",
              "count",
              "aggregate",
              "groupBy",
            ].includes(operation)
          ) {
            modelArgs.where = modelArgs.where
              ? { ...modelArgs.where, deletedAt: null }
              : { deletedAt: null };

            applySoftDeleteToRelations(modelArgs);

            if (operation === "findUnique") {
              return (baseClient as any)[uncapitalize(model)].findFirst(modelArgs);
            }
            if (operation === "findUniqueOrThrow") {
              return (baseClient as any)[uncapitalize(model)].findFirstOrThrow(modelArgs);
            }
          }

          return query(modelArgs);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

const existingPrisma = globalForPrisma.prisma;
const isStale = existingPrisma && !("studentAuditLog" in existingPrisma);

export const prisma =
  (!isStale ? existingPrisma : undefined) ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

