import { getICSList } from "@/app/actions/equipment-actions";
import IcsTable from "@/components/ics-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EquipmentMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { slips, totalPages, currentPage } = await getICSList(page);

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-end">
        <div>
          <CardTitle className="text-xl">Equipment Monitoring</CardTitle>
          <CardDescription>
            Track equipment issued through Inventory Custodian Slips (ICS).
          </CardDescription>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Custodian Slips</CardTitle>
          <CardDescription>
            Click an ICS No. to view or add equipment items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IcsTable
            slips={slips}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </main>
  );
}
