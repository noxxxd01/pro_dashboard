'use server';

import { prisma } from '@/lib/prisma';
import { buildDayRecords, generateDtrPdf } from '@/lib/dtr-pdf';

export async function generateDTR(
  studentId: string,
  year: number,
  month: number,
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const logs = await prisma.attendanceLog.findMany({
      where: {
        studentId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const logsByDay = new Map<number, (typeof logs)[number]>();
    for (const log of logs) {
      logsByDay.set(log.date.getDate(), log);
    }

    const days = buildDayRecords(year, month, logsByDay);

    const monthLabel = startOfMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const pdfBytes = await generateDtrPdf({
      studentName: student.fullName,
      monthLabel,
      days,
      supervisorName: 'Immediate Supervisor', // adjust or make configurable later
    });

    const base64 = Buffer.from(pdfBytes).toString('base64');
    return {
      success: true,
      pdfBase64: base64,
      fileName: `DTR_${student.fullName.replace(/\s+/g, '_')}.pdf`,
    };
  } catch (error) {
    console.error('generateDTR error:', error);
    return { success: false, error: 'Failed to generate DTR' };
  }
}
