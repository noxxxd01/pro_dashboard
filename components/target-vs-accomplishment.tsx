'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const chartConfig = {
  district1: {
    label: '1st District',
    color: 'var(--chart-1)',
  },
  district2: {
    label: '2nd District',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

interface TargetVsAccomplishmentDistrictChartProps {
  indicator: string;
  semester: string;
  target1stDistrict: number;
  target2ndDistrict: number;
  accomplished1st: number;
  accomplished2nd: number;
  projectName: string | null;
}

export function TargetVsAccomplishmentDistrictChart({
  indicator,
  semester,
  target1stDistrict,
  target2ndDistrict,
  accomplished1st,
  accomplished2nd,
  projectName,
}: TargetVsAccomplishmentDistrictChartProps) {
  const chartData = [
    {
      label: 'Target',
      district1: target1stDistrict,
      district2: target2ndDistrict,
    },
    {
      label: 'Accomplishment',
      district1: accomplished1st,
      district2: accomplished2nd,
    },
  ];

  const semesterLabel = semester === '1st' ? '1st Semester' : '2nd Semester';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-md leading-4'>{indicator}</CardTitle>
        <div className='flex items-center gap-2 flex-wrap'>
          <CardDescription>{semesterLabel}</CardDescription>
          {projectName && <Badge variant='outline'>{projectName}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25) || 1]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey='district1' fill='var(--color-district1)'>
              <LabelList
                position='top'
                offset={12}
                className='fill-foreground'
                fontSize={12}
              />
            </Bar>
            <Bar dataKey='district2' fill='var(--color-district2)'>
              <LabelList
                position='top'
                offset={12}
                className='fill-foreground'
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
