import { getActivityStats } from '@/app/actions/activity-actions';
import { getLabels } from '@/app/actions/label-action';
import { getSupplyRecords } from '@/app/actions/record-actions';
import { getReleasedSupplies } from '@/app/actions/released-supply-actions';
import { getSupplies, getSupplyStats } from '@/app/actions/supply-actions';
import ReleasedSupplyTable from '@/components/released-supply-table';
import SupplyRecordTable from '@/components/supply-record-table';
import SupplyTable from '@/components/supply-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOptionsForLabel } from '@/lib/label-utils';
import { GitPullRequest } from 'lucide-react';

export default async function SupplyMonitoring({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    releasedSearch?: string;
    page?: string;
  }>;
}) {
  const supplyStats = await getSupplyStats();

  const supplyMetrics = [
    {
      id: 'total-items',
      title: 'Total Supply Items',
      value: supplyStats.totalItems,
      description: 'Distinct items currently tracked.',
    },
    {
      id: 'total-stock',
      title: 'Total Stock on Hand',
      value: supplyStats.totalStock,
      description: 'Combined units across all supplies.',
    },
    {
      id: 'low-stock',
      title: 'Low Stock Items',
      value: supplyStats.lowStockCount,
      description: 'Items with fewer than 10 units left.',
    },
    {
      id: 'released-this-month',
      title: 'Released This Month',
      value: supplyStats.releasedThisMonth,
      description: 'Units released so far this month.',
    },
  ];

  const params = await searchParams;
  const search = params.search ?? '';
  const category = params.category ?? '';
  const page = Number(params.page) || 1;

  const [{ supplies, totalPages, currentPage }, labels] = await Promise.all([
    getSupplies(search || undefined, category || undefined, page),
    getLabels(),
  ]);

  const categoryOptions = getOptionsForLabel(labels, 'category');

  const releasedSearch = params.releasedSearch ?? '';

  const {
    releases,
    totalPages: releasedTotalPages,
    currentPage: releasedCurrentPage,
  } = await getReleasedSupplies(releasedSearch || undefined, page);

  const {
    records,
    totalPages: recordsTotalPages,
    currentPage: recordsCurrentPage,
  } = await getSupplyRecords(page);

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Supply Monitoring</CardTitle>
          <CardDescription>
            Monitor your organization's cybersecurity performance and
            compliance.
          </CardDescription>
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {supplyMetrics.map((item) => (
          <Card key={item.id} className='col-span-1'>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle
                className={`text-3xl ${item.id === 'low-stock' && item.value > 0 ? 'text-destructive' : ''}`}
              >
                {item.value}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue='supplies' className='w-full col-span-4'>
        <TabsList className='flex flex-row gap-2'>
          <TabsTrigger value='supplies'>Supplies</TabsTrigger>
          <TabsTrigger value='released-supplies'>Released Supplies</TabsTrigger>
          <TabsTrigger value='records'>Records</TabsTrigger>
        </TabsList>
        <TabsContent value='supplies'>
          <SupplyTable
            supplies={supplies}
            categoryOptions={categoryOptions}
            currentSearch={search}
            currentCategory={category}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </TabsContent>
        <TabsContent value='released-supplies'>
          <ReleasedSupplyTable
            releases={releases}
            currentSearch={releasedSearch}
            currentPage={releasedCurrentPage}
            totalPages={releasedTotalPages}
          />
        </TabsContent>
        <TabsContent value='records'>
          <SupplyRecordTable
            records={records}
            currentPage={recordsCurrentPage}
            totalPages={recordsTotalPages}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
