"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addLabel(name: string) {
  if (!name.trim()) {
    throw new Error("Label name is required");
  }

  const count = await prisma.label.count();
  const label = await prisma.label.create({
    data: { name, position: count },
  });

  revalidatePath("/");
  return label;
}

export async function getLabels() {
  return prisma.label.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      options: {
        include: {
          relationsFrom: { include: { relatedOption: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });
}
export async function reorderLabels(orderedIds: string[]) {
  try {
    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.label.update({ where: { id }, data: { position } }),
      ),
    );
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save label order" };
  }
}

export async function deleteLabel(id: string) {
  try {
    await prisma.label.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete label" };
  }
}
