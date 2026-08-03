"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateRisPdf } from "@/lib/ris-pdf";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const PAGE_SIZE = 10;

export async function releaseSupplyBatch(input: {
  requesteeName: string;
  requesteeDesignation?: string;
  office?: string;
  division?: string;
  city?: string;
  province?: string;
  purpose?: string;
  approvedByName?: string;
  approvedByDesignation?: string;
  issuedByName?: string;
  issuedByDesignation?: string;
  items: {
    supplyId: string;
    quantity: number;
    unitOfMeasure?: string;
    remarks?: string;
  }[];
}) {
  const items = input.items.filter((i) => i.supplyId && i.quantity > 0);

  if (!input.requesteeName.trim() || items.length === 0) {
    return { success: false, error: "Add at least one item and a requestee" };
  }

  try {
    // A supply can appear in more than one row (different remarks) — sum
    // requested quantities per supply so stock is checked against the true total.
    const totalsBySupply = new Map<string, number>();
    for (const item of items) {
      totalsBySupply.set(
        item.supplyId,
        (totalsBySupply.get(item.supplyId) ?? 0) + item.quantity,
      );
    }

    const supplies = await prisma.supply.findMany({
      where: { id: { in: [...totalsBySupply.keys()] } },
    });

    for (const [supplyId, totalQuantity] of totalsBySupply) {
      const supply = supplies.find((s) => s.id === supplyId);
      if (!supply) {
        return { success: false, error: "One of the selected supplies was not found" };
      }
      if (supply.stockQuantity < totalQuantity) {
        return {
          success: false,
          error: `Not enough stock for "${supply.name}" (requested ${totalQuantity}, ${supply.stockQuantity} available)`,
        };
      }
    }

    const batchId = crypto.randomUUID();
    const releasedDate = new Date();

    await prisma.$transaction([
      ...items.map((item) =>
        prisma.releasedSupply.create({
          data: {
            supplyId: item.supplyId,
            releasedQuantity: item.quantity,
            requesteeName: input.requesteeName,
            requesteeDesignation: input.requesteeDesignation,
            office: input.office,
            division: input.division,
            city: input.city,
            province: input.province,
            purpose: input.purpose,
            approvedByName: input.approvedByName,
            approvedByDesignation: input.approvedByDesignation,
            issuedByName: input.issuedByName,
            issuedByDesignation: input.issuedByDesignation,
            unitOfMeasure: item.unitOfMeasure,
            remarks: item.remarks,
            batchId,
            releasedDate,
          },
        }),
      ),
      ...[...totalsBySupply.entries()].map(([supplyId, totalQuantity]) =>
        prisma.supply.update({
          where: { id: supplyId },
          data: { stockQuantity: { decrement: totalQuantity } },
        }),
      ),
    ]);

    revalidatePath("/");
    return { success: true, batchId };
  } catch (error) {
    console.error("releaseSupplyBatch error:", error);
    return { success: false, error: "Failed to release supplies" };
  }
}

// RIS No. format: YY-MM-SSS — year, month, and a serial that resets every
// year. The serial is each batch's 1-based position among all batches
// created in that same year, ordered by when they were submitted.
function batchKeyOf(row: { id: string; batchId: string | null }) {
  return row.batchId ?? row.id;
}

async function buildRisNumberMap(
  year: number,
): Promise<Map<string, string>> {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const rowsThisYear = await prisma.releasedSupply.findMany({
    where: { createdAt: { gte: yearStart, lte: yearEnd } },
    select: { id: true, batchId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, string>();
  let serial = 0;
  for (const row of rowsThisYear) {
    const key = batchKeyOf(row);
    if (map.has(key)) continue;
    serial += 1;
    const month = row.createdAt.getMonth() + 1;
    map.set(
      key,
      `${String(year).slice(-2)}-${String(month).padStart(2, "0")}-${String(serial).padStart(3, "0")}`,
    );
  }
  return map;
}

async function buildRisNumber(anchor: {
  id: string;
  batchId: string | null;
  createdAt: Date;
}) {
  const map = await buildRisNumberMap(anchor.createdAt.getFullYear());
  return map.get(batchKeyOf(anchor)) ?? "—";
}

export async function generateRIS(key: string) {
  try {
    // `key` is a batch's batchId for grouped releases, or a row's own id
    // for the rare ungrouped legacy record — either can identify the RIS.
    const anchor = await prisma.releasedSupply.findFirst({
      where: { OR: [{ batchId: key }, { id: key }] },
    });

    if (!anchor) {
      return { success: false, error: "Release record not found" };
    }

    const releases = await prisma.releasedSupply.findMany({
      where: anchor.batchId ? { batchId: anchor.batchId } : { id: anchor.id },
      include: { supply: true },
      orderBy: { createdAt: "asc" },
    });

    const items = releases.map((release) => ({
      unit: release.unitOfMeasure ?? undefined,
      description: release.supply.size
        ? `${release.supply.name} (${release.supply.size})`
        : release.supply.name,
      quantity: release.releasedQuantity,
      remarks: release.remarks ?? undefined,
    }));

    const pdfBytes = await generateRisPdf({
      risNumber: await buildRisNumber(anchor),
      date: anchor.releasedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      office: anchor.office ?? undefined,
      division: anchor.division ?? undefined,
      cityMunicipality: anchor.city ?? "Surigao City",
      province: anchor.province ?? "Surigao del Norte",
      items,
      purpose: anchor.purpose ?? undefined,
      requestedBy: {
        name: anchor.requesteeName,
        designation: anchor.requesteeDesignation ?? undefined,
      },
      approvedBy: {
        name: anchor.approvedByName ?? undefined,
        designation: anchor.approvedByDesignation ?? undefined,
      },
      issuedBy: {
        name: anchor.issuedByName ?? undefined,
        designation: anchor.issuedByDesignation ?? undefined,
      },
      receivedBy: {
        name: anchor.requesteeName,
        designation: anchor.requesteeDesignation ?? undefined,
      },
    });

    const base64 = Buffer.from(pdfBytes).toString("base64");
    return {
      success: true,
      pdfBase64: base64,
      fileName: `RIS_${anchor.requesteeName.replace(/\s+/g, "_")}_${(anchor.batchId ?? anchor.id).slice(0, 6)}.pdf`,
    };
  } catch (error) {
    console.error("generateRIS error:", error);
    return { success: false, error: "Failed to generate RIS" };
  }
}

export async function uploadSignedRis(key: string, formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "No file selected" };
  }

  try {
    const rows = await prisma.releasedSupply.findMany({
      where: { OR: [{ batchId: key }, { id: key }] },
    });
    if (rows.length === 0) {
      return { success: false, error: "Record not found" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "ris");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    const signedRisUrl = `/uploads/ris/${fileName}`;

    await prisma.releasedSupply.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { signedRisUrl },
    });

    revalidatePath("/");
    return { success: true, signedRisUrl };
  } catch (error) {
    console.error("uploadSignedRis error:", error);
    return { success: false, error: "Failed to upload signed RIS" };
  }
}

export interface ReleaseBatchSummary {
  key: string;
  risNumber: string;
  requesteeName: string;
  approvedByName: string | null;
  issuedByName: string | null;
  status: "For Signature" | "Completed";
  releasedDate: Date;
  itemCount: number;
  signedRisUrl: string | null;
}

// One row per RIS (a batch of items released together), not per item —
// a single requisition slip can cover several supplies.
export async function getReleasedSupplyBatches(
  search?: string,
  page: number = 1,
) {
  const matchingRows = await prisma.releasedSupply.findMany({
    where: search
      ? {
          OR: [
            {
              supply: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              requesteeName: { contains: search, mode: "insensitive" as const },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  const batchOrder: string[] = [];
  const batches = new Map<string, typeof matchingRows>();
  for (const row of matchingRows) {
    const key = batchKeyOf(row);
    const list = batches.get(key);
    if (list) {
      list.push(row);
    } else {
      batches.set(key, [row]);
      batchOrder.push(key);
    }
  }

  const totalCount = batchOrder.length;
  const pageKeys = batchOrder.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // RIS numbers are global (independent of the search filter), so they're
  // computed per distinct year represented on this page rather than reusing
  // `matchingRows`.
  const yearsOnPage = new Set(
    pageKeys.map((key) => batches.get(key)![0].createdAt.getFullYear()),
  );
  const risNumberMaps = new Map(
    await Promise.all(
      [...yearsOnPage].map(
        async (year) => [year, await buildRisNumberMap(year)] as const,
      ),
    ),
  );

  const releases: ReleaseBatchSummary[] = pageKeys.map((key) => {
    const rows = batches.get(key)!;
    const anchor = rows[0];
    const year = anchor.createdAt.getFullYear();
    return {
      key,
      risNumber: risNumberMaps.get(year)?.get(key) ?? "—",
      requesteeName: anchor.requesteeName,
      approvedByName: anchor.approvedByName,
      issuedByName: anchor.issuedByName,
      status: anchor.signedRisUrl ? "Completed" : "For Signature",
      releasedDate: anchor.releasedDate,
      itemCount: rows.length,
      signedRisUrl: anchor.signedRisUrl,
    };
  });

  return {
    releases,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function deleteReleaseBatch(key: string) {
  try {
    const rows = await prisma.releasedSupply.findMany({
      where: { OR: [{ batchId: key }, { id: key }] },
    });
    if (rows.length === 0) {
      return { success: false, error: "Record not found" };
    }

    // Restore each supply's stock when its release batch is deleted.
    const totalsBySupply = new Map<string, number>();
    for (const row of rows) {
      totalsBySupply.set(
        row.supplyId,
        (totalsBySupply.get(row.supplyId) ?? 0) + row.releasedQuantity,
      );
    }

    await prisma.$transaction([
      prisma.releasedSupply.deleteMany({
        where: { id: { in: rows.map((r) => r.id) } },
      }),
      ...[...totalsBySupply.entries()].map(([supplyId, quantity]) =>
        prisma.supply.update({
          where: { id: supplyId },
          data: { stockQuantity: { increment: quantity } },
        }),
      ),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteReleaseBatch error:", error);
    return { success: false, error: "Failed to delete release record" };
  }
}
