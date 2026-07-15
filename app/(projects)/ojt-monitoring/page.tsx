import { getAttendanceLogs } from '@/app/actions/attendance-actions';
import { getStudents } from '@/app/actions/student-actions';
import OJTDashboard from '@/components/ojt-dashboard';
import RegisterStudents from '@/components/register-student';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter } from 'lucide-react';
import React from 'react';

export default async function OJTMonitoring() {
  const students = await getStudents();
  const logs = await getAttendanceLogs();
  return (
    <main>
      <Tabs defaultValue='dashboard' orientation='vertical'>
        <TabsList className='flex flex-col gap-2 w-40'>
          <TabsTrigger value='dashboard'>Dashboard</TabsTrigger>
          <TabsTrigger value='register-students'>Register Students</TabsTrigger>
        </TabsList>
        <TabsContent value='dashboard' className='pl-6'>
          <OJTDashboard logs={logs} />
        </TabsContent>
        <TabsContent value='register-students' className='pl-6'>
          <RegisterStudents students={students} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
