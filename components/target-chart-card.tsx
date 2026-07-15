"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";

const chartConfig = {
  value: {
    label: "Value",
  },
  Target: {
    label: "Target",
    color: "var(--chart-1)",
  },
  Accomplishment: {
    label: "Accomplishment",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface TargetChartCardProps {
  indicator: string;
  semester: string;
  target: number;
  accomplished: number;
  projectName: string | null;
}

export function TargetChartCard({
  indicator,
  semester,
  target,
  accomplished,
  projectName,
}: TargetChartCardProps) {
  const chartData = [
    { label: "Target", value: target },
    { label: "Accomplishment", value: accomplished },
  ];

  const percent = target > 0 ? ((accomplished / target) * 100).toFixed(1) : "0";
  const semesterLabel = semester === "1st" ? "1st Semester" : "2nd Semester";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{indicator}</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <CardDescription>{semesterLabel}</CardDescription>
          {projectName && <Badge variant="outline">{projectName}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25) || 1]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value">
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={`var(--color-${entry.label})`} />
              ))}
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <CardTitle>{percent}% of target reached</CardTitle>
        <CardDescription>
          Target: {target} · Accomplished: {accomplished}
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
