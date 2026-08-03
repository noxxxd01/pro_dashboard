"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface SupplyInput {
  name: string;
  size?: string;
  unit?: string;
  categoryOptionId?: string;
  stockQuantity: number;
  stockInDate?: Date;
}

export async function addSupply(input: SupplyInput) {
  if (!input.name.trim()) {
    return { success: false, error: "Supply name is required" };
  }

  try {
    const existing = await prisma.supply.findFirst({
      where: {
        name: { equals: input.name.trim(), mode: "insensitive" },
        size: input.size
          ? { equals: input.size.trim(), mode: "insensitive" }
          : null,
        categoryOptionId: input.categoryOptionId || null,
      },
    });

    if (existing) {
      await prisma.supply.update({
        where: { id: existing.id },
        data: {
          stockQuantity: { increment: input.stockQuantity },
          // Update stockInDate to the latest restock date, if provided
          stockInDate: input.stockInDate ?? existing.stockInDate,
          unit: input.unit || existing.unit,
        },
      });

      revalidatePath("/");
      return { success: true, merged: true };
    }

    await prisma.supply.create({
      data: {
        name: input.name,
        size: input.size || null,
        unit: input.unit || null,
        categoryOptionId: input.categoryOptionId || null,
        stockQuantity: input.stockQuantity,
        stockInDate: input.stockInDate ?? null,
      },
    });

    revalidatePath("/");
    return { success: true, merged: false };
  } catch (error) {
    console.error("addSupply error:", error);
    return { success: false, error: "Failed to add supply" };
  }
}

const PAGE_SIZE = 10;

export async function getSupplies(
  search?: string,
  categoryOptionId?: string,
  page: number = 1,
) {
  const where = {
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(categoryOptionId ? { categoryOptionId } : {}),
  };

  const [supplies, totalCount] = await Promise.all([
    prisma.supply.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.supply.count({ where }),
  ]);

  return {
    supplies,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function deleteSupply(id: string) {
  try {
    await prisma.supply.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete supply" };
  }
}

export async function getSupplyStats() {
  const LOW_STOCK_THRESHOLD = 10;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  const [totalItems, stockSum, lowStockCount, releasedThisMonth] =
    await Promise.all([
      prisma.supply.count(),
      prisma.supply.aggregate({ _sum: { stockQuantity: true } }),
      prisma.supply.count({
        where: { stockQuantity: { lt: LOW_STOCK_THRESHOLD } },
      }),
      prisma.releasedSupply.aggregate({
        where: { releasedDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { releasedQuantity: true },
      }),
    ]);

  return {
    totalItems,
    totalStock: stockSum._sum.stockQuantity ?? 0,
    lowStockCount,
    releasedThisMonth: releasedThisMonth._sum.releasedQuantity ?? 0,
  };
}
