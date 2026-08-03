"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateIcsPdf } from "@/lib/ics-pdf";

const PAGE_SIZE = 10;

// ICS No. format: ICS YY-MM-SSS — year, month, and a serial that resets
// every year, based on this slip's 1-based position among all slips
// created in that same year, ordered by when they were created.
async function buildIcsNumber(anchor: { id: string; createdAt: Date }) {
  const year = anchor.createdAt.getFullYear();
  const month = anchor.createdAt.getMonth() + 1;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const rowsThisYear = await prisma.inventoryCustodianSlip.findMany({
    where: { createdAt: { gte: yearStart, lte: yearEnd } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const serial = Math.max(
    1,
    rowsThisYear.findIndex((r) => r.id === anchor.id) + 1,
  );

  return `ICS ${String(year).slice(-2)}-${String(month).padStart(2, "0")}-${String(serial).padStart(3, "0")}`;
}

export async function createICS(input: {
  office: string;
  poNumber?: string;
  province?: string;
  date?: Date;
}) {
  if (!input.office.trim()) {
    return { success: false, error: "Office is required" };
  }

  try {
    const ics = await prisma.inventoryCustodianSlip.create({
      data: {
        office: input.office,
        poNumber: input.poNumber || null,
        province: input.province || null,
        date: input.date ?? new Date(),
      },
    });

    revalidatePath("/equipment-monitoring");
    return { success: true, id: ics.id };
  } catch (error) {
    console.error("createICS error:", error);
    return { success: false, error: "Failed to create ICS" };
  }
}

export async function getICSList(page: number = 1) {
  const [slips, totalCount] = await Promise.all([
    prisma.inventoryCustodianSlip.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.inventoryCustodianSlip.count(),
  ]);

  const slipsWithNumbers = await Promise.all(
    slips.map(async (slip) => ({
      id: slip.id,
      icsNumber: await buildIcsNumber(slip),
      office: slip.office,
      poNumber: slip.poNumber,
      province: slip.province,
      date: slip.date,
      itemCount: slip._count.items,
    })),
  );

  return {
    slips: slipsWithNumbers,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function getICSById(id: string) {
  const ics = await prisma.inventoryCustodianSlip.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!ics) return null;

  return {
    ...ics,
    icsNumber: await buildIcsNumber(ics),
  };
}

export async function deleteICS(id: string) {
  try {
    await prisma.inventoryCustodianSlip.delete({ where: { id } });
    revalidatePath("/equipment-monitoring");
    return { success: true };
  } catch (error) {
    console.error("deleteICS error:", error);
    return { success: false, error: "Failed to delete ICS" };
  }
}

// Seeds auto-generated property numbers (PN-<year>-<seed>) so the field
// arrives pre-filled instead of blank. Scoped globally (not per-ICS) since
// property tags must stay unique across the whole inventory.
export async function getNextPropertyNumberSeed() {
  return (await prisma.equipmentItem.count()) + 1;
}

interface EquipmentRowInput {
  quantity: number;
  serialNumber?: string;
  propertyNumber?: string;
}

export async function addEquipmentItems(
  icsId: string,
  input: {
    unit?: string;
    description: string;
    unitCost?: number;
    dateAcquired?: Date;
    estimatedUsefulLife?: string;
    assignedTo?: string;
    remarks?: string;
    rows: EquipmentRowInput[];
  },
) {
  const rows = input.rows.filter((r) => r.quantity > 0);

  if (!input.description.trim() || rows.length === 0) {
    return { success: false, error: "Description and quantity are required" };
  }

  try {
    // Serial-tracked additions create one row per physical unit (quantity 1
    // each); plain bulk additions create a single row carrying the full count.
    await prisma.$transaction(
      rows.map((row) =>
        prisma.equipmentItem.create({
          data: {
            icsId,
            quantity: row.quantity,
            unit: input.unit || null,
            description: input.description,
            unitCost: input.unitCost ?? null,
            dateAcquired: input.dateAcquired ?? null,
            propertyNumber: row.propertyNumber || null,
            serialNumber: row.serialNumber || null,
            estimatedUsefulLife: input.estimatedUsefulLife || null,
            assignedTo: input.assignedTo || null,
            remarks: input.remarks || null,
          },
        }),
      ),
    );

    revalidatePath(`/equipment-monitoring/${icsId}`);
    return { success: true };
  } catch (error) {
    console.error("addEquipmentItems error:", error);
    return { success: false, error: "Failed to add equipment items" };
  }
}

export async function deleteEquipmentItem(id: string, icsId: string) {
  try {
    await prisma.equipmentItem.delete({ where: { id } });
    revalidatePath(`/equipment-monitoring/${icsId}`);
    return { success: true };
  } catch (error) {
    console.error("deleteEquipmentItem error:", error);
    return { success: false, error: "Failed to delete equipment item" };
  }
}

export async function generateICS(id: string) {
  try {
    const ics = await prisma.inventoryCustodianSlip.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    if (!ics) {
      return { success: false, error: "ICS not found" };
    }

    const pdfBytes = await generateIcsPdf({
      icsNumber: await buildIcsNumber(ics),
      date: ics.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      office: ics.office,
      poNumber: ics.poNumber ?? undefined,
      province: ics.province ?? undefined,
      items: ics.items.map((item) => ({
        quantity: item.quantity,
        unit: item.unit ?? undefined,
        description: item.description,
        unitCost: item.unitCost ?? undefined,
        dateAcquired: item.dateAcquired
          ? item.dateAcquired.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : undefined,
        propertyNumber: item.propertyNumber ?? undefined,
        serialNumber: item.serialNumber ?? undefined,
        estimatedUsefulLife: item.estimatedUsefulLife ?? undefined,
        assignedTo: item.assignedTo ?? undefined,
        remarks: item.remarks ?? undefined,
      })),
    });

    const base64 = Buffer.from(pdfBytes).toString("base64");
    return {
      success: true,
      pdfBase64: base64,
      fileName: `ICS_${ics.office.replace(/\s+/g, "_")}_${ics.id.slice(0, 6)}.pdf`,
    };
  } catch (error) {
    console.error("generateICS error:", error);
    return { success: false, error: "Failed to generate ICS" };
  }
}
