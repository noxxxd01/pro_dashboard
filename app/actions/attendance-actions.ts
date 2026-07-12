'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAttendanceLogs() {
  return prisma.attendanceLog.findMany({
    include: { student: true },
    orderBy: { date: 'desc' },
  });
}

export async function clearAllAttendanceLogs() {
  try {
    await prisma.attendanceLog.deleteMany();
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to clear logs' };
  }
}

// Total hours rendered per student, aggregated across all their logs
export async function getTotalHoursPerStudent() {
  const results = await prisma.attendanceLog.groupBy({
    by: ['studentId'],
    _sum: { hoursRendered: true },
  });

  return results.map((r) => ({
    studentId: r.studentId,
    totalHours: r._sum.hoursRendered ?? 0,
  }));
}

// Scan a student by student number: creates a new log or updates today's log
export async function scanStudent(studentNumber: string) {
  const student = await prisma.student.findUnique({
    where: { studentNumber },
  });

  if (!student) {
    return { success: false, error: 'Student not found' };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existingLog = await prisma.attendanceLog.findFirst({
    where: {
      studentId: student.id,
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const now = new Date();

  try {
    if (!existingLog) {
      // First scan of the day: Time In
      await prisma.attendanceLog.create({
        data: { studentId: student.id, timeIn: now, status: 'Present' },
      });
      return {
        success: true,
        action: 'Time In',
        studentName: student.fullName,
      };
    }

    if (!existingLog.breakIn) {
      await prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: { breakIn: now, status: 'On Break' },
      });
      return {
        success: true,
        action: 'Break In',
        studentName: student.fullName,
      };
    }

    if (!existingLog.breakOut) {
      await prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: { breakOut: now, status: 'Present' },
      });
      return {
        success: true,
        action: 'Break Out',
        studentName: student.fullName,
      };
    }

    if (!existingLog.timeOut) {
      const hoursRendered =
        (now.getTime() - existingLog.timeIn!.getTime()) / (1000 * 60 * 60) -
        (existingLog.breakOut!.getTime() - existingLog.breakIn!.getTime()) /
          (1000 * 60 * 60);

      await prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          timeOut: now,
          hoursRendered: Math.max(0, Number(hoursRendered.toFixed(2))),
          status: 'Present',
        },
      });

      revalidatePath('/');
      return {
        success: true,
        action: 'Time Out',
        studentName: student.fullName,
      };
    }

    return {
      success: false,
      error: "Student has already completed today's attendance",
    };
  } finally {
    revalidatePath('/');
  }
}
