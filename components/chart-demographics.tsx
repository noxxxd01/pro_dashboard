"use client";

import { TrendingUp } from "lucide-react";
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

const chartConfig = {
  count: {
    label: "Participants",
  },
  Female: {
    label: "Female",
    color: "var(--chart-1)",
  },
  Male: {
    label: "Male",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface GenderData {
  gender: "Female" | "Male";
  count: number;
}

interface ChartDemographicsProps {
  data: GenderData[];
}

export function ChartDemographics({ data }: ChartDemographicsProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const femaleCount = data.find((d) => d.gender === "Female")?.count ?? 0;
  const femalePercent =
    total > 0 ? ((femaleCount / total) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender Demographics</CardTitle>
        <CardDescription>Total participants reached, by gender</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="gender"
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
            <Bar dataKey="count" radius={0}>
              {data.map((entry) => (
                <Cell
                  key={entry.gender}
                  fill={`var(--color-${entry.gender})`}
                />
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
    </Card>
  );
}
