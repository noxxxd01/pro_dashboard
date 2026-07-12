'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const PAGE_SIZE = 10;

export async function addInGoingLetter(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const bureauOptionId = formData.get('bureauOptionId') as string;
  const receivedDateRaw = formData.get('receivedDate') as string;
  const noResponseNeeded = formData.get('noResponseNeeded') === 'true';
  const file = formData.get('file') as File | null;

  if (!name?.trim()) {
    return { success: false, error: 'Letter name is required' };
  }

  try {
    let fileUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'letters',
      );
      await mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      fileUrl = `/uploads/letters/${fileName}`;
    }

    await prisma.letter.create({
      data: {
        name,
        type: type || 'request',
        fileUrl,
        bureauOptionId: bureauOptionId || null,
        receivedDate: receivedDateRaw ? new Date(receivedDateRaw) : null,
        status: 'Received',
        response: noResponseNeeded ? 'No response needed' : '-',
        noResponseNeeded,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('addInGoingLetter error:', error);
    return { success: false, error: 'Failed to save letter' };
  }
}

export async function getInGoingLetters(page: number = 1) {
  const [letters, totalCount] = await Promise.all([
    prisma.letter.findMany({
      include: {
        bureau: true,
        outGoingResponses: {
          orderBy: { createdAt: 'desc' },
          take: 1, // most recent response, if any
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.letter.count(),
  ]);

  return {
    letters,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function deleteLetter(id: string) {
  try {
    await prisma.letter.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete letter' };
  }
}

export async function getInGoingLetterOptions() {
  return prisma.letter.findMany({
    where: {
      noResponseNeeded: false,
      outGoingResponses: { none: {} }, // exclude letters that already have a response
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function addOutGoingLetter(formData: FormData) {
  const requestLetterId = formData.get('requestLetterId') as string;
  const responseLetterName = formData.get('responseLetterName') as string;
  const bureauOptionId = formData.get('bureauOptionId') as string;
  const sentDateRaw = formData.get('sentDate') as string;
  const file = formData.get('file') as File | null;

  if (!requestLetterId) {
    return { success: false, error: 'Please select a request letter' };
  }
  if (!responseLetterName?.trim()) {
    return { success: false, error: 'Response letter name is required' };
  }

  try {
    let fileUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'letters',
      );
      await mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      fileUrl = `/uploads/letters/${fileName}`;
    }

    const status = fileUrl ? 'Sent' : 'Pending';

    await prisma.$transaction([
      prisma.outGoingLetter.create({
        data: {
          requestLetterId,
          responseLetterName,
          bureauOptionId: bureauOptionId || null,
          sentDate: sentDateRaw ? new Date(sentDateRaw) : null,
          fileUrl,
          status,
        },
      }),
      // Update the original in-going letter's status too, but only once we
      // actually have a response file — matching the same "Sent" condition
      ...(fileUrl
        ? [
            prisma.letter.update({
              where: { id: requestLetterId },
              data: { status: 'Sent' },
            }),
          ]
        : []),
    ]);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('addOutGoingLetter error:', error);
    return { success: false, error: 'Failed to save outgoing letter' };
  }
}

export async function getOutGoingLetters(page: number = 1) {
  const [letters, totalCount] = await Promise.all([
    prisma.outGoingLetter.findMany({
      include: {
        bureau: true,
        requestLetter: true, // gives us requestLetter.fileUrl and requestLetter.name
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.outGoingLetter.count(),
  ]);

  return {
    letters,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function deleteOutGoingLetter(id: string) {
  try {
    await prisma.outGoingLetter.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete outgoing letter' };
  }
}

export async function getLetterStats() {
  const [totalInGoing, pendingResponse, sentResponses, totalOutGoing] =
    await Promise.all([
      prisma.letter.count(),
      prisma.letter.count({
        where: {
          status: 'Received',
          noResponseNeeded: false,
        },
      }),
      prisma.letter.count({
        where: { status: 'Sent' },
      }),
      prisma.outGoingLetter.count(),
    ]);

  return {
    totalInGoing,
    pendingResponse,
    sentResponses,
    totalOutGoing,
  };
}
