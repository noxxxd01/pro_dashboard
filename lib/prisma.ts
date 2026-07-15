import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  basePrisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.basePrisma = basePrisma;
}

const LOGGED_OPERATIONS = new Set([
  "create",
  "update",
  "delete",
  "createMany",
  "updateMany",
  "deleteMany",
]);

const ACTION_BY_OPERATION: Record<string, string> = {
  create: "created",
  createMany: "created",
  update: "updated",
  updateMany: "updated",
  delete: "deleted",
  deleteMany: "deleted",
};

const DISPLAY_NAME_FIELDS = [
  "billName",
  "activityName",
  "fullName",
  "responseLetterName",
  "requesteeName",
  "name",
];

function summarize(model: string, result: unknown): string {
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    for (const field of DISPLAY_NAME_FIELDS) {
      const value = record[field];
      if (typeof value === "string" && value) return value;
    }
    if (typeof record.count === "number") {
      return `${record.count} record(s)`;
    }
  }
  return model;
}

export const prisma = basePrisma.$extends({
  name: "activity-logger",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);

        if (model && model !== "ActivityLog" && LOGGED_OPERATIONS.has(operation)) {
          const record =
            result && typeof result === "object"
              ? (result as Record<string, unknown>)
              : null;
          const entityId =
            record && typeof record.id === "string" ? record.id : null;

          try {
            await basePrisma.activityLog.create({
              data: {
                action: ACTION_BY_OPERATION[operation],
                entityType: model,
                entityId,
                summary: summarize(model, result),
              },
            });
          } catch (error) {
            console.error("Failed to write activity log:", error);
          }
        }

        return result;
      },
    },
  },
});
