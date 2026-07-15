import {
  getActivityStats,
  getCompletedActivitiesByMunicipality,
  getGenderDemographics,
  getModeOfImplementationBreakdown,
  getOverallTargetAchievementRate,
  getTargetAccomplishments,
} from '@/app/actions/activity-actions';
import { ActivityMap } from '@/components/activity-map';
import { ChartDemographics } from '@/components/chart-demographics';
import { ChartModeOfImplementation } from '@/components/chart-mode-implementation';
import { CompletedActivitiesChart } from '@/components/completed-activities-chart';
import { DataTableProjects } from '@/components/data-table-projects';
import FilterTerm from '@/components/filter-term';
import { TargetAnalyticsGrid } from '@/components/target-analytics-grid';
import { TargetChartCard } from '@/components/target-chart-card';
import { TargetVsAccomplishmentDistrictChart } from '@/components/target-vs-accomplishment';
import { TargetsDialog } from '@/components/targets-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ViewTargets from '@/components/view-targets';

export default async function CybersecurityPage({
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
  const stats = await getActivityStats(
    'Cybersecurity',
    params.year,
    params.semester,
  );
  const achievementRate = await getOverallTargetAchievementRate(
    'Cybersecurity',
    params.year,
    params.semester,
  );

  const cybersecurityData = [
    {
      id: 'completed-activities',
      title: 'Completed Activities',
      value: stats.completedCount,
      description: 'Activities completed to date.',
    },
    {
      id: 'upcoming-activities',
      title: 'Upcoming Activities',
      value: stats.upcomingCount,
      description: 'Activities scheduled ahead.',
    },
    {
      id: 'total-participants',
      title: 'Total Participants',
      value: stats.totalParticipants,
      description: 'Participants reached so far.',
    },
    {
      id: 'achievement-rate',
      title: 'Target Achievement Rate',
      value: achievementRate !== null ? `${achievementRate}%` : '—',
      description:
        achievementRate !== null
          ? 'Average progress across all set targets.'
          : 'No targets set yet.',
    },
  ];

  const municipalityData = await getCompletedActivitiesByMunicipality(
    'Cybersecurity',
    params.year,
    params.semester,
    params.project,
  );
  const genderData = await getGenderDemographics(
    'Cybersecurity',
    params.year,
    params.semester,
    params.project,
  );
  const modeData = await getModeOfImplementationBreakdown(
    'Cybersecurity',
    params.year,
    params.semester,
    params.project,
  );
  const targetData = await getTargetAccomplishments(
    'Cybersecurity',
    params.year,
    params.semester,
  );

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Cybersecurity Metrics</CardTitle>
          <CardDescription>
            Monitor your organization's cybersecurity performance and
            compliance.
          </CardDescription>
        </div>
        <div className='flex flex-row gap-2'>
          <ViewTargets bureauName='Cybersecurity' />
          <TargetsDialog />
          <FilterTerm />
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {cybersecurityData.map((item) => (
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
      <Tabs defaultValue='overview' className='w-full col-span-4'>
        <TabsList className='flex flex-row gap-2'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='map'>Map</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <DataTableProjects bureauName='Cybersecurity' searchParams={params} />
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
      </Tabs>
    </main>
  );
}
