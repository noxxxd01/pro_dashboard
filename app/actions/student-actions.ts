'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface StudentInput {
  fullName: string;
  studentNumber: string;
  school: string;
  targetHours: number;
  email: string;
  phoneNumber: string;
}

export async function registerStudent(input: StudentInput) {
  if (!input.fullName.trim()) {
    return { success: false, error: 'Full name is required' };
  }
  if (!input.studentNumber.trim()) {
    return { success: false, error: 'Student number is required' };
  }

  try {
    const existing = await prisma.student.findUnique({
      where: { studentNumber: input.studentNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: 'A student with this number already exists',
      };
    }

    await prisma.student.create({
      data: {
        fullName: input.fullName,
        studentNumber: input.studentNumber,
        school: input.school,
        targetHours: input.targetHours,
        email: input.email,
        phoneNumber: input.phoneNumber,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('registerStudent error:', error);
    return { success: false, error: 'Failed to register student' };
  }
}

export async function getStudents() {
  const students = await prisma.student.findMany({
    orderBy: { fullName: 'asc' },
    include: {
      attendanceLogs: {
        select: { hoursRendered: true },
      },
    },
  });

  return students.map((student) => ({
    ...student,
    totalHoursRendered: student.attendanceLogs.reduce(
      (sum, log) => sum + log.hoursRendered,
      0,
    ),
  }));
}

interface UpdateStudentInput {
  id: string;
  fullName: string;
  studentNumber: string;
  school: string;
  targetHours: number;
  email: string;
  phoneNumber: string;
}

export async function updateStudent(input: UpdateStudentInput) {
  if (!input.fullName.trim()) {
    return { success: false, error: 'Full name is required' };
  }

  try {
    await prisma.student.update({
      where: { id: input.id },
      data: {
        fullName: input.fullName,
        studentNumber: input.studentNumber,
        school: input.school,
        targetHours: input.targetHours,
        email: input.email,
        phoneNumber: input.phoneNumber,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('updateStudent error:', error);
    return { success: false, error: 'Failed to update student' };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete student' };
  }
}
