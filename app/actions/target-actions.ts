'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface TargetInput {
  name: string;
  target1stDistrict: number;
  target2ndDistrict: number;
  semester: string;
  year: number;
  measurementType: string;
  bureauOptionId: string;
  projectOptionId?: string;
}

export async function addTargets(targets: TargetInput[]) {
  const validTargets = targets.filter((t) => t.name.trim() && t.bureauOptionId);

  if (validTargets.length === 0) {
    return { success: false, error: 'At least one valid target is required' };
  }

  try {
    await prisma.target.createMany({
      data: validTargets.map((t) => ({
        name: t.name,
        target1stDistrict: t.target1stDistrict,
        target2ndDistrict: t.target2ndDistrict,
        semester: t.semester,
        year: t.year || new Date().getFullYear(),
        measurementType: t.measurementType || 'activities',
        bureauOptionId: t.bureauOptionId,
        projectOptionId: t.projectOptionId || null,
      })),
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('addTargets error:', error);
    return { success: false, error: 'Failed to save targets' };
  }
}

export async function getTargets(
  bureauName?: string,
  year?: string,
  semester?: string,
) {
  return prisma.target.findMany({
    where: {
      ...(bureauName
        ? { bureau: { name: { equals: bureauName, mode: 'insensitive' as const } } }
        : {}),
      ...(year ? { year: Number(year) } : {}),
      ...(semester ? { semester } : {}),
    },
    include: { bureau: true, project: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIndicatorsForBureauProject(
  bureauOptionId: string,
  projectOptionId?: string,
) {
  if (!bureauOptionId) return [];

  const targets = await prisma.target.findMany({
    where: { bureauOptionId, projectOptionId: projectOptionId || null },
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });

  return targets.map((t) => ({ id: t.name, name: t.name }));
}

export async function getTargetById(id: string) {
  return prisma.target.findUnique({
    where: { id },
    include: { bureau: true, project: true },
  });
}

interface UpdateTargetInput {
  id: string;
  name: string;
  target1stDistrict: number;
  target2ndDistrict: number;
  semester: string;
  year: number;
  measurementType: string;
  bureauOptionId: string;
  projectOptionId?: string;
}

export async function updateTarget(input: UpdateTargetInput) {
  if (!input.name.trim() || !input.bureauOptionId) {
    return { success: false, error: 'Indicator name and bureau are required' };
  }

  try {
    await prisma.target.update({
      where: { id: input.id },
      data: {
        name: input.name,
        target1stDistrict: input.target1stDistrict,
        target2ndDistrict: input.target2ndDistrict,
        semester: input.semester,
        year: input.year || new Date().getFullYear(),
        measurementType: input.measurementType || 'activities',
        bureauOptionId: input.bureauOptionId,
        projectOptionId: input.projectOptionId || null,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('updateTarget error:', error);
    return { success: false, error: 'Failed to update target' };
  }
}

export async function deleteTarget(id: string) {
  try {
    await prisma.target.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete target' };
  }
}
