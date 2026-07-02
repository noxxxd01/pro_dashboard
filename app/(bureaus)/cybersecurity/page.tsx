'use client';
import { DataTableProjects } from '@/components/data-table-projects';
import FilterTerm from '@/components/filter-term';
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
import { FilterIcon, Plus } from 'lucide-react';
import React from 'react';

interface CybersecurityMetric {
  id: string;
  title: string;
  description: string;
}

const cybersecurityData: CybersecurityMetric[] = [
  {
    id: 'threats-detected',
    title: 'Threats Detected',
    description: '128 threats identified and neutralized this month.',
  },
  {
    id: 'active-incidents',
    title: 'Active Incidents',
    description: '3 incidents currently under investigation.',
  },
  {
    id: 'vulnerability-score',
    title: 'Vulnerability Score',
    description: 'System risk rated 7.2/10, down from last quarter.',
  },
  {
    id: 'patch-compliance',
    title: 'Patch Compliance',
    description: '94% of systems are running the latest security patches.',
  },
];

export default function CybersecurityPage() {
  const [position, setPosition] = React.useState('bottom');
  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Cybersecurity Metrics</CardTitle>
          <CardDescription className='text-sm text-muted-foreground'>
            Monitor your organization's cybersecurity performance and
            compliance.
          </CardDescription>
        </div>
        <div className='flex flex-row gap-2'>
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
              <p>{item.description}</p>
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
          <DataTableProjects />
        </TabsContent>
        <TabsContent value='map'>Map content goes here.</TabsContent>
        <TabsContent value='analytics'>
          Analytics content goes here.
        </TabsContent>
      </Tabs>
    </main>
  );
}
