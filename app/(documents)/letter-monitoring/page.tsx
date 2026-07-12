import {
  getInGoingLetters,
  getOutGoingLetters,
  getLetterStats,
} from '@/app/actions/letter-actions';
import InGoingLetters from '@/components/in-going-letters-table';
import OutGoingLetters from '@/components/out-going-letter-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function LetterMonitoring({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const letterStats = await getLetterStats();

  const letterMetrics = [
    {
      id: 'total-in-going',
      title: 'Total In-Going Letters',
      value: letterStats.totalInGoing,
      description: 'Letters received to date.',
    },
    {
      id: 'pending-response',
      title: 'Pending Response',
      value: letterStats.pendingResponse,
      description: 'Letters awaiting a response.',
    },
    {
      id: 'sent-responses',
      title: 'Sent Responses',
      value: letterStats.sentResponses,
      description: 'Letters successfully responded to.',
    },
    {
      id: 'total-out-going',
      title: 'Total Out-Going Letters',
      value: letterStats.totalOutGoing,
      description: 'Responses sent out overall.',
    },
  ];

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { letters, totalPages, currentPage } = await getInGoingLetters(page);
  const {
    letters: outGoingLetters,
    totalPages: outGoingTotalPages,
    currentPage: outGoingCurrentPage,
  } = await getOutGoingLetters(page);

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <CardTitle className='text-xl'>Letter Monitoring</CardTitle>
          <CardDescription>
            Track incoming letters and outgoing responses.
          </CardDescription>
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {letterMetrics.map((item) => (
          <Card key={item.id} className='col-span-1'>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle
                className={`text-3xl ${item.id === 'pending-response' && item.value > 0 ? 'text-destructive' : ''}`}
              >
                {item.value}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue='in-going'>
        <TabsList>
          <TabsTrigger value='in-going'>In Going Letters</TabsTrigger>
          <TabsTrigger value='out-going'>Out Going Letters</TabsTrigger>
        </TabsList>
        <TabsContent value='in-going'>
          <InGoingLetters
            letters={letters}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </TabsContent>
        <TabsContent value='out-going'>
          <OutGoingLetters
            letters={outGoingLetters}
            currentPage={outGoingCurrentPage}
            totalPages={outGoingTotalPages}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
