import { getBills, getBillStats } from '@/app/actions/bill-actions';
import BillsTable from '@/components/bills-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function BillsMonitoring({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const billStats = await getBillStats();

  const billMetrics = [
    {
      id: 'total-bills',
      title: 'Total Bills',
      value: billStats.totalBills,
      description: 'Bills recorded to date.',
    },
    {
      id: 'unpaid-bills',
      title: 'Unpaid Bills',
      value: billStats.unpaidCount,
      description: 'Bills awaiting payment.',
    },
    {
      id: 'overdue-bills',
      title: 'Overdue Bills',
      value: billStats.overdueCount,
      description: 'Unpaid bills past their due date.',
    },
    {
      id: 'unpaid-amount',
      title: 'Unpaid Amount',
      value: `₱${billStats.unpaidAmount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      description: 'Total amount still owed.',
    },
  ];

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { bills, totalPages, currentPage } = await getBills(page);

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Bills Monitoring</CardTitle>
          <CardDescription>
            Track utility bills, due dates, and payment status.
          </CardDescription>
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {billMetrics.map((item) => (
          <Card key={item.id} className='col-span-1'>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle
                className={`text-3xl ${item.id === 'overdue-bills' && billStats.overdueCount > 0 ? 'text-destructive' : ''}`}
              >
                {item.value}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <BillsTable bills={bills} currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
}
