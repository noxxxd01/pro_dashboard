"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Completed Activities",
  },
  district1: {
    label: "District 1",
    color: "var(--chart-2)",
  },
  district2: {
    label: "District 2",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ProjectCount {
  projectName: string;
  count: number;
}

interface MunicipalityData {
  municipality: string;
  count: number;
  projects: ProjectCount[];
}

interface CompletedActivitiesChartProps {
  district1: MunicipalityData[];
  district2: MunicipalityData[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data: MunicipalityData = payload[0].payload;

  return (
    <div className="border bg-background p-2.5 shadow-sm text-xs min-w-42.5">
      <div className="font-medium mb-1.5">{data.municipality}</div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Completed</span>
        <span className="font-mono font-medium">{data.count}</span>
      </div>
      {data.projects.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t space-y-0.5">
          {data.projects.map((p) => (
            <div key={p.projectName} className="flex justify-between gap-4">
              <span className="text-muted-foreground truncate">
                {p.projectName}
              </span>
              <span className="font-mono font-medium">{p.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompletedActivitiesChart({
  district1,
  district2,
}: CompletedActivitiesChartProps) {
  const [activeDistrict, setActiveDistrict] = React.useState<
    "district1" | "district2"
  >("district1");

  const totals = React.useMemo(
    () => ({
      district1: district1.reduce((acc, curr) => acc + curr.count, 0),
      district2: district2.reduce((acc, curr) => acc + curr.count, 0),
    }),
    [district1, district2],
  );

  const chartData = activeDistrict === "district1" ? district1 : district2;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Completed Activities Conducted</CardTitle>
          <CardDescription>
            Completed activities by municipality, Surigao del Norte
          </CardDescription>
        </div>
        <div className="flex">
          {(["district1", "district2"] as const).map((key) => (
            <button
              key={key}
              data-active={activeDistrict === key}
              className="relative z-30 flex flex-1 flex-col w-28 justify-center gap-1 border-t px-4 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-4 sm:py-6"
              onClick={() => setActiveDistrict(key)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {totals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0, top: 20 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="municipality"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={0}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25) || 1]}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill={`var(--color-${activeDistrict})`}>
              <LabelList
                position="top"
                offset={8}
                className="fill-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
