import { notFound } from "next/navigation";
import Link from "next/link";
import { getICSById } from "@/app/actions/equipment-actions";
import EquipmentItemsTable from "@/components/equipment-items-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default async function IcsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ics = await getICSById(id);

  if (!ics) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-end">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
            <Link href="/equipment-monitoring">
              <ArrowLeft className="w-4 h-4" /> Back to Equipment Monitoring
            </Link>
          </Button>
          <CardTitle className="text-xl">{ics.icsNumber}</CardTitle>
          <CardDescription>
            {ics.office} — {format(ics.date, "MMM d, yyyy")}
          </CardDescription>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Office</p>
              <p>{ics.office}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PO No.</p>
              <p>{ics.poNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Province</p>
              <p>{ics.province ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p>{format(ics.date, "MMM d, yyyy")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment Items</CardTitle>
          <CardDescription>
            Items covered by this Inventory Custodian Slip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentItemsTable icsId={ics.id} items={ics.items} />
        </CardContent>
      </Card>
    </main>
  );
}
