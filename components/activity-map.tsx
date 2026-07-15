'use client';

import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Skeleton } from './ui/skeleton';

interface ProjectCount {
  projectName: string;
  count: number;
}

interface MunicipalityData {
  municipality: string;
  count: number;
  projects: ProjectCount[];
}

interface ActivityMapProps {
  district1: MunicipalityData[];
  district2: MunicipalityData[];
}

const ActivityMapLeaflet = dynamic(() => import('./activity-map-leaflet'), {
  ssr: false,
  loading: () => <Skeleton className='h-96 w-full rounded-md' />,
});

export function ActivityMap({ district1, district2 }: ActivityMapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Coverage Map</CardTitle>
        <CardDescription>
          Completed activities by municipality across District 1 and
          District 2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityMapLeaflet district1={district1} district2={district2} />
      </CardContent>
    </Card>
  );
}
