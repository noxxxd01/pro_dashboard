'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const PAGE_SIZE = 10;

async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || file.size <= 0) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bills');
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);
  return `/uploads/bills/${fileName}`;
}

export async function addBill(formData: FormData) {
  const billName = formData.get('billName') as string;
  const billingType = formData.get('billingType') as string;
  const amountRaw = formData.get('amount') as string;
  const location = formData.get('location') as string;
  const dateReceivedRaw = formData.get('dateReceived') as string;
  const dueDateRaw = formData.get('dueDate') as string;
  const disconnectionDateRaw = formData.get('disconnectionDate') as string;
  const remarks = formData.get('remarks') as string;
  const file = formData.get('file') as File | null;

  if (!billName?.trim()) {
    return { success: false, error: 'Bill name is required' };
  }
  if (!location?.trim()) {
    return { success: false, error: 'Location/Office is required' };
  }
  const amount = Number(amountRaw);
  if (!amountRaw || Number.isNaN(amount)) {
    return { success: false, error: 'A valid amount is required' };
  }

  try {
    const fileUrl = await saveUpload(file);

    await prisma.bill.create({
      data: {
        billName,
        billingType: billingType || 'Electricity Bill',
        fileUrl,
        amount,
        location,
        dateReceived: dateReceivedRaw ? new Date(dateReceivedRaw) : null,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        disconnectionDate: disconnectionDateRaw
          ? new Date(disconnectionDateRaw)
          : null,
        remarks: remarks || null,
      },
    });

    revalidatePath('/bills-monitoring');
    return { success: true };
  } catch (error) {
    console.error('addBill error:', error);
    return { success: false, error: 'Failed to save bill' };
  }
}

export async function getBills(page: number = 1) {
  const [bills, totalCount] = await Promise.all([
    prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.bill.count(),
  ]);

  return {
    bills,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function getBillById(id: string) {
  return prisma.bill.findUnique({ where: { id } });
}

export async function deleteBill(id: string) {
  try {
    await prisma.bill.delete({ where: { id } });
    revalidatePath('/bills-monitoring');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete bill' };
  }
}

export async function toggleBillStatus(id: string, status: boolean) {
  try {
    await prisma.bill.update({
      where: { id },
      data: {
        status,
        datePaid: status ? new Date() : null,
      },
    });
    revalidatePath('/bills-monitoring');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update status' };
  }
}

interface UpdateBillInput {
  id: string;
  billName: string;
  billingType: string;
  amount: number;
  location: string;
  dateReceived?: Date;
  dueDate?: Date;
  disconnectionDate?: Date;
  remarks: string;
  orLabel: string;
}

export async function updateBill(input: UpdateBillInput, formData?: FormData) {
  try {
    const file = formData?.get('file') as File | null;
    const orFile = formData?.get('orFile') as File | null;

    const fileUrl = await saveUpload(file ?? null);
    const orFileUrl = await saveUpload(orFile ?? null);

    await prisma.bill.update({
      where: { id: input.id },
      data: {
        billName: input.billName,
        billingType: input.billingType,
        amount: input.amount,
        location: input.location,
        dateReceived: input.dateReceived ?? null,
        dueDate: input.dueDate ?? null,
        disconnectionDate: input.disconnectionDate ?? null,
        remarks: input.remarks || null,
        orLabel: input.orLabel || null,
        ...(fileUrl ? { fileUrl } : {}),
        ...(orFileUrl ? { orFileUrl } : {}),
      },
    });

    revalidatePath('/bills-monitoring');
    return { success: true };
  } catch (error) {
    console.error('updateBill error:', error);
    return { success: false, error: 'Failed to update bill' };
  }
}

export async function getBillStats() {
  const [totalBills, unpaidCount, overdueCount, unpaidAmount] =
    await Promise.all([
      prisma.bill.count(),
      prisma.bill.count({ where: { status: false } }),
      prisma.bill.count({
        where: { status: false, dueDate: { lt: new Date() } },
      }),
      prisma.bill.aggregate({
        where: { status: false },
        _sum: { amount: true },
      }),
    ]);

  return {
    totalBills,
    unpaidCount,
    overdueCount,
    unpaidAmount: unpaidAmount._sum.amount ?? 0,
  };
}
