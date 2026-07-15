'use server';

import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 10;

interface GetActivityLogsInput {
  page?: number;
  entityType?: string;
  action?: string;
}

export async function getActivityLogs({
  page = 1,
  entityType,
  action,
}: GetActivityLogsInput = {}) {
  const where = {
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
  };

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function getLogEntityTypes() {
  const rows = await prisma.activityLog.findMany({
    distinct: ['entityType'],
    select: { entityType: true },
    orderBy: { entityType: 'asc' },
  });
  return rows.map((r) => r.entityType);
}

export async function getLogStats() {
  const [total, created, updated, deleted] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.count({ where: { action: 'created' } }),
    prisma.activityLog.count({ where: { action: 'updated' } }),
    prisma.activityLog.count({ where: { action: 'deleted' } }),
  ]);

  return { total, created, updated, deleted };
}
