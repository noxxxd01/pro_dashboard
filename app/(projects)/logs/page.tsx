import {
  getActivityLogs,
  getLogEntityTypes,
  getLogStats,
} from '@/app/actions/log-actions';
import LogsTable from '@/components/logs-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function Logs({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entityType?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const logStats = await getLogStats();

  const logMetrics = [
    {
      id: 'total',
      title: 'Total Actions',
      value: logStats.total,
      description: 'All logged actions to date.',
    },
    {
      id: 'created',
      title: 'Created',
      value: logStats.created,
      description: 'Records created.',
    },
    {
      id: 'updated',
      title: 'Updated',
      value: logStats.updated,
      description: 'Records updated.',
    },
    {
      id: 'deleted',
      title: 'Deleted',
      value: logStats.deleted,
      description: 'Records deleted.',
    },
  ];

  const [{ logs, totalPages, currentPage }, entityTypes] = await Promise.all([
    getActivityLogs({
      page,
      entityType: params.entityType,
      action: params.action,
    }),
    getLogEntityTypes(),
  ]);

  return (
    <main className='flex flex-col gap-4'>
      <div>
        <CardTitle className='text-xl'>Logs</CardTitle>
        <CardDescription>
          A record of every action taken across the site.
        </CardDescription>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {logMetrics.map((item) => (
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
      <LogsTable
        logs={logs}
        currentPage={currentPage}
        totalPages={totalPages}
        entityTypes={entityTypes}
      />
    </main>
  );
}
