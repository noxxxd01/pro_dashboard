import {
  getActivitiesForCalendar,
  getActivityStats,
  getCompletedActivitiesByMunicipality,
  getCybersecurityHighlights,
  getGenderDemographics,
  getLguPenetrationRate,
  getModeOfImplementationBreakdown,
  getTargetAccomplishments,
} from "@/app/actions/activity-actions";
import { ActivityCalendar } from "@/components/activity-calendar";
import { ActivityMap } from "@/components/activity-map";
import { ChartDemographics } from "@/components/chart-demographics";
import { ChartModeOfImplementation } from "@/components/chart-mode-implementation";
import { CompletedActivitiesChart } from "@/components/completed-activities-chart";
import { DataTableProjects } from "@/components/data-table-projects";
import FilterTerm from "@/components/filter-term";
import { getCurrentTerm } from "@/lib/term";
import { TargetAnalyticsGrid } from "@/components/target-analytics-grid";
import { TargetChartCard } from "@/components/target-chart-card";
import { TargetVsAccomplishmentDistrictChart } from "@/components/target-vs-accomplishment";
import { TargetsDialog } from "@/components/targets-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewTargets from "@/components/view-targets";

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
  const currentTerm = getCurrentTerm();
  const filterYear = params.year ?? String(currentTerm.year);
  const filterSemester = params.semester ?? currentTerm.semester;
  const stats = await getActivityStats(
    "Cybersecurity",
    filterYear,
    filterSemester,
  );
  const lguPenetration = await getLguPenetrationRate(
    "Cybersecurity",
    filterYear,
    filterSemester,
  );
  const highlights = await getCybersecurityHighlights(
    filterYear,
    filterSemester,
  );

  const cybersecurityData = [
    {
      id: "completed-activities",
      title: "Completed Activities",
      value: stats.completedCount,
      description: "Activities completed to date.",
    },
    {
      id: "upcoming-activities",
      title: "Upcoming Activities",
      value: stats.upcomingCount,
      description: "Activities scheduled ahead.",
    },
    {
      id: "total-participants",
      title: "Total Participants",
      value: stats.totalParticipants,
      description: "Participants reached so far.",
    },
    {
      id: "lgu-penetration-rate",
      title: "LGU Penetration Rate",
      value: `${lguPenetration.rate}%`,
      description: `${lguPenetration.reached} of ${lguPenetration.total} SDN LGUs reached with activities.`,
    },
    {
      id: "ciesmd-completed",
      title: "Cybersecurity Awareness Campaigns",
      value: highlights.ciesmdCompleted,
      description: "Completed activities under the CIESMD project.",
    },
    {
      id: "pnpki-trainings",
      title: "PNPKI User's Trainings Conducted",
      value: highlights.trainingsConducted,
      description: "Trainings upon request or with partner stakeholders.",
    },
    {
      id: "pnpki-awareness",
      title: "PNPKI Awareness Campaigns",
      value: highlights.awarenessCampaigns,
      description: "Government entities reached with PNPKI awareness.",
    },
    {
      id: "digital-certificates",
      title: "Digital Certificates Issued",
      value: highlights.certificatesIssued,
      description: "Participants issued with Digital Certificates.",
    },
  ];

  const municipalityData = await getCompletedActivitiesByMunicipality(
    "Cybersecurity",
    filterYear,
    filterSemester,
    params.project,
  );
  const genderData = await getGenderDemographics(
    "Cybersecurity",
    filterYear,
    filterSemester,
    params.project,
  );
  const modeData = await getModeOfImplementationBreakdown(
    "Cybersecurity",
    filterYear,
    filterSemester,
    params.project,
  );
  const targetData = await getTargetAccomplishments(
    "Cybersecurity",
    filterYear,
    filterSemester,
  );
  const calendarData = await getActivitiesForCalendar("Cybersecurity");

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-end">
        <div>
          <CardTitle className="text-xl">Cybersecurity Bureau</CardTitle>
          <CardDescription>
            Monitor your organization's cybersecurity performance and
            compliance.
          </CardDescription>
        </div>
        <div className="flex flex-row gap-2">
          <ViewTargets bureauName="Cybersecurity" />
          <TargetsDialog />
          <FilterTerm />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cybersecurityData.map((item) => (
          <Card key={item.id} className="col-span-1">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="analytics" className="w-full col-span-4">
        <TabsList className="flex flex-row gap-2">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="activities">
          <DataTableProjects
            bureauName="Cybersecurity"
            searchParams={{
              ...params,
              year: filterYear,
              semester: filterSemester,
            }}
          />
        </TabsContent>
        <TabsContent value="map">
          <ActivityMap
            district1={municipalityData.district1}
            district2={municipalityData.district2}
          />
        </TabsContent>
        <TabsContent value="analytics" className="flex flex-col gap-4">
          <TargetAnalyticsGrid targetData={targetData} />

          <CompletedActivitiesChart
            district1={municipalityData.district1}
            district2={municipalityData.district2}
          />
          <div className="grid grid-cols-4 gap-4">
            <ChartDemographics data={genderData} />
            <ChartModeOfImplementation data={modeData} />
          </div>
        </TabsContent>
        <TabsContent value="calendar">
          <ActivityCalendar activities={calendarData} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
