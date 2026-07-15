'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TargetVsAccomplishmentDistrictChart } from '@/components/target-vs-accomplishment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TargetData {
  indicator: string;
  semester: string;
  target1stDistrict: number;
  target2ndDistrict: number;
  accomplished1st: number;
  accomplished2nd: number;
  projectName: string | null;
}

interface TargetAnalyticsGridProps {
  targetData: TargetData[];
}

export function TargetAnalyticsGrid({ targetData }: TargetAnalyticsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project') ?? 'all';

  const setProjectFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('project');
    } else {
      params.set('project', value);
    }
    router.push(`?${params.toString()}`);
  };

  const projectNames = Array.from(
    new Set(
      targetData
        .map((t) => t.projectName)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  const filteredData = targetData.filter(
    (t) => projectFilter === 'all' || t.projectName === projectFilter,
  );

  return (
    <div className='flex flex-col gap-4'>
      {targetData.length > 0 && projectNames.length > 0 && (
        <div className='flex items-center gap-2'>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className='w-56'>
              <SelectValue placeholder='Filter by project' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Projects</SelectItem>
              {projectNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredData.length === 0 ? (
          <p className='text-sm text-muted-foreground col-span-full text-center py-8'>
            {targetData.length === 0
              ? 'No targets set yet for this bureau.'
              : 'No targets match the selected project.'}
          </p>
        ) : (
          filteredData.map((t, index) => (
            <TargetVsAccomplishmentDistrictChart
              key={index}
              indicator={t.indicator}
              semester={t.semester}
              target1stDistrict={t.target1stDistrict}
              target2ndDistrict={t.target2ndDistrict}
              accomplished1st={t.accomplished1st}
              accomplished2nd={t.accomplished2nd}
              projectName={t.projectName}
            />
          ))
        )}
      </div>
    </div>
  );
}
