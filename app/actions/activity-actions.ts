'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface AddActivityInput {
  activityName: string;
  activityVenue?: string;
  selectedIndicators: string[];
  barangay?: string;
  dateFrom?: Date;
  dateTo?: Date;
  femaleCount: number;
  maleCount: number;
  totalCount: number;
  bureauOptionId?: string;
  projectOptionId?: string;
  districtOptionId?: string;
  municipalityOptionId?: string;
  requestingAgencyId?: string;
  modeOfImplementationId?: string;
  statusId?: string;
  selectedTargetSectors: string[];
  selectedResponsiblePerson: string[];
}

export async function addActivity(input: AddActivityInput) {
  if (!input.activityName.trim()) {
    return { success: false, error: 'Activity name is required' };
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        activityName: input.activityName,
        activityVenue: input.activityVenue || null,
        barangay: input.barangay || null,
        dateFrom: input.dateFrom ?? null,
        dateTo: input.dateTo ?? null,
        femaleCount: input.femaleCount,
        maleCount: input.maleCount,
        totalCount: input.totalCount,
        bureauOptionId: input.bureauOptionId || null,
        projectOptionId: input.projectOptionId || null,
        districtOptionId: input.districtOptionId || null,
        municipalityOptionId: input.municipalityOptionId || null,
        requestingAgencyId: input.requestingAgencyId || null,
        modeOfImplementationId: input.modeOfImplementationId || null,
        statusId: input.statusId || null,
        targetSectors: {
          create: input.selectedTargetSectors.map((optionId) => ({ optionId })),
        },
        responsiblePersons: {
          create: input.selectedResponsiblePerson.map((optionId) => ({
            optionId,
          })),
        },
        indicators: {
          create: input.selectedIndicators.map((name) => ({ name })),
        },
      },
    });

    revalidatePath('/');
    return { success: true, activity };
  } catch (error) {
    console.error('addActivity error:', error);
    return { success: false, error: 'Failed to save activity' };
  }
}

const PAGE_SIZE = 10;

export async function getActivities(
  bureauName?: string,
  page: number = 1,
  year?: string,
  semester?: string,
) {
  const dateRange = getDateRangeFilter(year, semester);

  const where = {
    ...(bureauName
      ? { bureau: { name: { equals: bureauName, mode: 'insensitive' as const } } }
      : {}),
    ...(dateRange ? { dateFrom: dateRange } : {}),
  };

  const [activities, totalCount] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        bureau: true,
        project: true,
        district: true,
        municipality: true,
        requestingAgency: true,
        modeOfImplementation: true,
        status: true,
        targetSectors: { include: { option: true } },
        responsiblePersons: { include: { option: true } },
        indicators: true,
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function deleteActivity(id: string) {
  try {
    await prisma.activity.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('deleteActivity error:', error);
    return { success: false, error: 'Failed to delete activity' };
  }
}

export async function getActivityStats(
  bureauName: string,
  year?: string,
  semester?: string,
) {
  const dateRange = getDateRangeFilter(year, semester);

  const where = {
    bureau: {
      name: { equals: bureauName, mode: 'insensitive' as const },
    },
    ...(dateRange ? { dateFrom: dateRange } : {}),
  };

  const [completedCount, upcomingCount, participantsResult] = await Promise.all(
    [
      prisma.activity.count({
        where: {
          ...where,
          status: {
            name: { equals: 'Completed', mode: 'insensitive' },
          },
        },
      }),
      prisma.activity.count({
        where: {
          ...where,
          dateFrom: { ...dateRange, gt: new Date() },
        },
      }),
      prisma.activity.aggregate({
        where,
        _sum: { totalCount: true },
      }),
    ],
  );

  return {
    completedCount,
    upcomingCount,
    totalParticipants: participantsResult._sum.totalCount ?? 0,
  };
}

const DISTRICT_1_MUNICIPALITIES = [
  'Burgos',
  'Dapa',
  'Del Carmen',
  'General Luna',
  'Pilar',
  'San Benito',
  'San Isidro',
  'Santa Monica',
  'Socorro',
];

const DISTRICT_2_MUNICIPALITIES = [
  'Alegria',
  'Bacuag',
  'Claver',
  'Gigaquit',
  'Mainit',
  'Malimono',
  'Placer',
  'San Francisco',
  'Surigao City',
  'Sison',
  'Tagana-an',
  'Tubod',
];

export async function getCompletedActivitiesByMunicipality(
  bureauName: string,
  year?: string,
  semester?: string,
  projectName?: string,
) {
  const dateRange = getDateRangeFilter(year, semester);

  const completedActivities = await prisma.activity.findMany({
    where: {
      bureau: { name: { equals: bureauName, mode: 'insensitive' } },
      status: { name: { equals: 'Completed', mode: 'insensitive' } },
      ...(dateRange ? { dateFrom: dateRange } : {}),
      ...(projectName
        ? { project: { name: { equals: projectName, mode: 'insensitive' } } }
        : {}),
    },
    include: {
      municipality: true,
      project: true,
    },
  });

  // municipality name -> project name -> count
  const dataByMunicipality = new Map<string, Map<string, number>>();

  for (const activity of completedActivities) {
    const municipalityName = activity.municipality?.name;
    const projectName = activity.project?.name;
    if (!municipalityName || !projectName) continue;

    const projectCounts =
      dataByMunicipality.get(municipalityName) ?? new Map<string, number>();
    projectCounts.set(projectName, (projectCounts.get(projectName) ?? 0) + 1);
    dataByMunicipality.set(municipalityName, projectCounts);
  }

  const buildList = (names: string[]) =>
    names.map((name) => {
      const projectCounts = dataByMunicipality.get(name);
      const projects = projectCounts
        ? Array.from(projectCounts.entries()).map(([projectName, count]) => ({
            projectName,
            count,
          }))
        : [];

      const totalCount = projects.reduce((sum, p) => sum + p.count, 0);

      return {
        municipality: name,
        count: totalCount,
        projects,
      };
    });

  return {
    district1: buildList(DISTRICT_1_MUNICIPALITIES),
    district2: buildList(DISTRICT_2_MUNICIPALITIES),
  };
}

export async function getGenderDemographics(
  bureauName: string,
  year?: string,
  semester?: string,
  projectName?: string,
): Promise<{ gender: 'Female' | 'Male'; count: number }[]> {
  const dateRange = getDateRangeFilter(year, semester);

  const activities = await prisma.activity.findMany({
    where: {
      bureau: { name: { equals: bureauName, mode: 'insensitive' } },
      ...(dateRange ? { dateFrom: dateRange } : {}),
      ...(projectName
        ? { project: { name: { equals: projectName, mode: 'insensitive' } } }
        : {}),
    },
    select: {
      femaleCount: true,
      maleCount: true,
    },
  });

  const totalFemale = activities.reduce((sum, a) => sum + a.femaleCount, 0);
  const totalMale = activities.reduce((sum, a) => sum + a.maleCount, 0);

  return [
    { gender: 'Female', count: totalFemale },
    { gender: 'Male', count: totalMale },
  ];
}

export async function getModeOfImplementationBreakdown(
  bureauName: string,
  year?: string,
  semester?: string,
  projectName?: string,
) {
  const dateRange = getDateRangeFilter(year, semester);

  const activities = await prisma.activity.findMany({
    where: {
      bureau: { name: { equals: bureauName, mode: 'insensitive' } },
      ...(dateRange ? { dateFrom: dateRange } : {}),
      ...(projectName
        ? { project: { name: { equals: projectName, mode: 'insensitive' } } }
        : {}),
    },
    include: {
      modeOfImplementation: true,
    },
  });

  const countByMode = new Map<string, number>();
  for (const activity of activities) {
    const modeName = activity.modeOfImplementation?.name;
    if (!modeName) continue;
    countByMode.set(modeName, (countByMode.get(modeName) ?? 0) + 1);
  }

  return Array.from(countByMode.entries()).map(([mode, count]) => ({
    mode,
    count,
  }));
}

function getSemesterDateRange(semester: string, year: number) {
  if (semester === '1st') {
    return {
      start: new Date(year, 0, 1), // Jan 1
      end: new Date(year, 5, 30, 23, 59, 59), // Jun 30
    };
  }
  return {
    start: new Date(year, 6, 1), // Jul 1
    end: new Date(year, 11, 31, 23, 59, 59), // Dec 31
  };
}

function getDateRangeFilter(year?: string, semester?: string) {
  if (!year) return undefined;
  const y = Number(year);
  if (!semester) {
    return { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59) };
  }
  const { start, end } = getSemesterDateRange(semester, y);
  return { gte: start, lte: end };
}

type ActivityWhere = NonNullable<Parameters<typeof prisma.activity.count>[0]>['where'];

async function measureAccomplishment(
  where: ActivityWhere,
  measurementType: string,
) {
  if (measurementType === 'participants') {
    const result = await prisma.activity.aggregate({
      where,
      _sum: { totalCount: true },
    });
    const sum = result._sum as { totalCount: number | null };
    return sum?.totalCount ?? 0;
  }
  return prisma.activity.count({ where });
}

export async function getTargetAccomplishments(
  bureauName: string,
  year?: string,
  semester?: string,
) {
  const districtLabel = await prisma.label.findFirst({
    where: { name: { equals: 'District', mode: 'insensitive' } },
    include: { options: { orderBy: { name: 'asc' } } },
  });

  const district1Id = districtLabel?.options[0]?.id;
  const district2Id = districtLabel?.options[1]?.id;

  const allTargets = await prisma.target.findMany({
    where: { bureau: { name: { equals: bureauName, mode: 'insensitive' } } },
    include: { bureau: true, project: true },
  });

  const targets = allTargets.filter(
    (t) =>
      (!semester || t.semester === semester) &&
      (!year || t.year === Number(year)),
  );

  const results = await Promise.all(
    targets.map(async (target) => {
      // Each target's accomplishment is always measured over its own
      // year+semester window, regardless of the page filter.
      const { start, end } = getSemesterDateRange(target.semester, target.year);

      const baseWhere = {
        bureau: { name: { equals: bureauName, mode: 'insensitive' as const } },
        status: { name: { equals: 'Completed', mode: 'insensitive' as const } },
        dateFrom: { gte: start, lte: end },
        indicators: {
          some: { name: { equals: target.name, mode: 'insensitive' as const } },
        },
        ...(target.projectOptionId
          ? { projectOptionId: target.projectOptionId }
          : {}),
      };

      const [accomplished1st, accomplished2nd] = await Promise.all([
        district1Id
          ? measureAccomplishment(
              { ...baseWhere, districtOptionId: district1Id },
              target.measurementType,
            )
          : 0,
        district2Id
          ? measureAccomplishment(
              { ...baseWhere, districtOptionId: district2Id },
              target.measurementType,
            )
          : 0,
      ]);

      return {
        indicator: target.name,
        semester: target.semester,
        measurementType: target.measurementType,
        target1stDistrict: target.target1stDistrict,
        target2ndDistrict: target.target2ndDistrict,
        accomplished1st,
        accomplished2nd,
        projectName: target.project?.name ?? null,
      };
    }),
  );

  return results;
}

interface UpdateActivityInput {
  id: string;
  activityName: string;
  activityVenue?: string;
  selectedIndicators: string[];
  barangay?: string;
  dateFrom?: Date;
  dateTo?: Date;
  femaleCount: number;
  maleCount: number;
  totalCount: number;
  bureauOptionId?: string;
  projectOptionId?: string;
  districtOptionId?: string;
  municipalityOptionId?: string;
  requestingAgencyId?: string;
  modeOfImplementationId?: string;
  statusId?: string;
  selectedTargetSectors: string[];
  selectedResponsiblePerson: string[];
}

export async function updateActivity(input: UpdateActivityInput) {
  if (!input.activityName.trim()) {
    return { success: false, error: 'Activity name is required' };
  }

  try {
    await prisma.$transaction([
      // Clear existing many-to-many rows so we can replace them cleanly
      prisma.activityTargetSector.deleteMany({
        where: { activityId: input.id },
      }),
      prisma.activityResponsiblePerson.deleteMany({
        where: { activityId: input.id },
      }),
      prisma.activityIndicator.deleteMany({
        where: { activityId: input.id },
      }),
      prisma.activity.update({
        where: { id: input.id },
        data: {
          activityName: input.activityName,
          activityVenue: input.activityVenue || null,
          barangay: input.barangay || null,
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
          femaleCount: input.femaleCount,
          maleCount: input.maleCount,
          totalCount: input.totalCount,
          bureauOptionId: input.bureauOptionId || null,
          projectOptionId: input.projectOptionId || null,
          districtOptionId: input.districtOptionId || null,
          municipalityOptionId: input.municipalityOptionId || null,
          requestingAgencyId: input.requestingAgencyId || null,
          modeOfImplementationId: input.modeOfImplementationId || null,
          statusId: input.statusId || null,
          targetSectors: {
            create: input.selectedTargetSectors.map((optionId) => ({
              optionId,
            })),
          },
          responsiblePersons: {
            create: input.selectedResponsiblePerson.map((optionId) => ({
              optionId,
            })),
          },
          indicators: {
            create: input.selectedIndicators.map((name) => ({ name })),
          },
        },
      }),
    ]);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('updateActivity error:', error);
    return { success: false, error: 'Failed to update activity' };
  }
}

export async function getActivityById(id: string) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      bureau: true,
      project: true,
      district: true,
      municipality: true,
      requestingAgency: true,
      modeOfImplementation: true,
      status: true,
      targetSectors: { include: { option: true } },
      responsiblePersons: { include: { option: true } },
      indicators: true,
    },
  });
}

export async function getOverallTargetAchievementRate(
  bureauName: string,
  year?: string,
  semester?: string,
) {
  const allTargetData = await getTargetAccomplishments(
    bureauName,
    year,
    semester,
  );

  // Only count-based targets go into the overall rate — participant-sum
  // targets (e.g. "Number of individuals reached") measure a different
  // thing and can dwarf small activity-count targets, skewing the blend.
  const targetData = allTargetData.filter(
    (t) => t.measurementType !== 'participants',
  );

  if (targetData.length === 0) {
    return null;
  }

  const totalTarget = targetData.reduce(
    (sum, t) => sum + t.target1stDistrict + t.target2ndDistrict,
    0,
  );
  const totalAccomplished = targetData.reduce(
    (sum, t) => sum + t.accomplished1st + t.accomplished2nd,
    0,
  );

  if (totalTarget === 0) return null;

  return Math.round((totalAccomplished / totalTarget) * 100);
}
