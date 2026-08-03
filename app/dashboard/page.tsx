import {
  getActivitiesForCalendar,
  getActivityStats,
  getCompletedActivitiesByMunicipality,
  getGenderDemographics,
  getLguPenetrationRate,
  getModeOfImplementationBreakdown,
  getOverallTargetAchievementRate,
  getTargetAccomplishments,
} from '@/app/actions/activity-actions';
import { ActivityCalendar } from '@/components/activity-calendar';
import { ActivityMap } from '@/components/activity-map';
import { ChartDemographics } from '@/components/chart-demographics';
import { ChartModeOfImplementation } from '@/components/chart-mode-implementation';
import { CompletedActivitiesChart } from '@/components/completed-activities-chart';
import { DataTableProjects } from '@/components/data-table-projects';
import FilterTerm from '@/components/filter-term';
import { getCurrentTerm } from '@/lib/term';
import { TargetAnalyticsGrid } from '@/components/target-analytics-grid';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    year?: string;
    semester?: string;
    project?: string;
  }>;
}) {
  const params = await searchParams;
  const currentTerm = getCurrentTerm();
  const filterYear = params.year ?? String(currentTerm.year);
  const filterSemester = params.semester ?? currentTerm.semester;

  // No bureau name is passed to any of these — the dashboard aggregates
  // accomplishments across every bureau, unlike the per-bureau pages.
  const stats = await getActivityStats(undefined, filterYear, filterSemester);
  const lguPenetration = await getLguPenetrationRate(
    undefined,
    filterYear,
    filterSemester,
  );
  const achievementRate = await getOverallTargetAchievementRate(
    undefined,
    filterYear,
    filterSemester,
  );

  const overviewData = [
    {
      id: 'completed-activities',
      title: 'Completed Activities',
      value: stats.completedCount,
      description: 'Activities completed to date, across all bureaus.',
    },
    {
      id: 'upcoming-activities',
      title: 'Upcoming Activities',
      value: stats.upcomingCount,
      description: 'Activities scheduled ahead, across all bureaus.',
    },
    {
      id: 'total-participants',
      title: 'Total Participants',
      value: stats.totalParticipants,
      description: 'Participants reached so far, across all bureaus.',
    },
    {
      id: 'achievement-rate',
      title: 'Target Achievement Rate',
      value: achievementRate !== null ? `${achievementRate}%` : '—',
      description:
        achievementRate !== null
          ? "Average progress across every bureau's set targets."
          : 'No targets set yet.',
    },
    {
      id: 'lgu-penetration-rate',
      title: 'LGU Penetration Rate',
      value: `${lguPenetration.rate}%`,
      description: `${lguPenetration.reached} of ${lguPenetration.total} SDN LGUs reached by any bureau.`,
    },
  ];

  const municipalityData = await getCompletedActivitiesByMunicipality(
    undefined,
    filterYear,
    filterSemester,
    params.project,
  );
  const genderData = await getGenderDemographics(
    undefined,
    filterYear,
    filterSemester,
    params.project,
  );
  const modeData = await getModeOfImplementationBreakdown(
    undefined,
    filterYear,
    filterSemester,
    params.project,
  );
  const targetData = await getTargetAccomplishments(
    undefined,
    filterYear,
    filterSemester,
  );
  const calendarData = await getActivitiesForCalendar();

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Provincial Office Dashboard</CardTitle>
          <CardDescription>
            Combined performance and accomplishments across every bureau.
          </CardDescription>
        </div>
        <div className='flex flex-row gap-2'>
          <FilterTerm />
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
        {overviewData.map((item) => (
          <Card key={item.id} className='col-span-1'>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle className='text-3xl'>{item.value}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue='analytics' className='w-full col-span-4'>
        <TabsList className='flex flex-row gap-2'>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='activities'>Activities</TabsTrigger>
          <TabsTrigger value='map'>Map</TabsTrigger>
          <TabsTrigger value='calendar'>Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value='activities'>
          <DataTableProjects
            searchParams={{
              ...params,
              year: filterYear,
              semester: filterSemester,
            }}
          />
        </TabsContent>
        <TabsContent value='map'>
          <ActivityMap
            district1={municipalityData.district1}
            district2={municipalityData.district2}
          />
        </TabsContent>
        <TabsContent value='analytics' className='flex flex-col gap-4'>
          <TargetAnalyticsGrid targetData={targetData} />

          <CompletedActivitiesChart
            district1={municipalityData.district1}
            district2={municipalityData.district2}
          />
          <div className='grid grid-cols-4 gap-4'>
            <ChartDemographics data={genderData} />
            <ChartModeOfImplementation data={modeData} />
          </div>
        </TabsContent>
        <TabsContent value='calendar'>
          <ActivityCalendar activities={calendarData} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
