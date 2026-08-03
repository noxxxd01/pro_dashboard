"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { FileText, Trash } from "lucide-react";
import AddEquipmentItemDialog from "./add-equipment-item-dialog";
import {
  deleteEquipmentItem,
  generateICS,
} from "@/app/actions/equipment-actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface EquipmentItem {
  id: string;
  quantity: number;
  unit: string | null;
  description: string;
  unitCost: number | null;
  dateAcquired: Date | null;
  propertyNumber: string | null;
  serialNumber: string | null;
  estimatedUsefulLife: string | null;
  assignedTo: string | null;
  remarks: string | null;
}

interface EquipmentItemsTableProps {
  icsId: string;
  items: EquipmentItem[];
}

function openPdf(pdfBase64: string) {
  const byteCharacters = atob(pdfBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  URL.revokeObjectURL(url);
}

export default function EquipmentItemsTable({
  icsId,
  items,
}: EquipmentItemsTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, description: string) => {
    startTransition(async () => {
      const result = await deleteEquipmentItem(id, icsId);
      if (result.success) {
        toast.success(`"${description}" removed`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const handlePrint = () => {
    startTransition(async () => {
      const result = await generateICS(icsId);
      if (result.success && result.pdfBase64) {
        openPdf(result.pdfBase64);
      } else {
        toast.error(result.error ?? "Failed to generate ICS");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar">
        <Table className="w-max min-w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-20">Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Date Acquired</TableHead>
              <TableHead>Property No.</TableHead>
              <TableHead>Serial No.</TableHead>
              <TableHead>Est. Useful Life</TableHead>
              <TableHead>Assigned/Deployed</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-muted-foreground py-8"
                >
                  No equipment items yet. Click &quot;Add Equipment&quot; to
                  add one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium py-4">
                    {item.quantity}
                  </TableCell>
                  <TableCell>{item.unit ?? "—"}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {item.unitCost != null ? item.unitCost.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell>
                    {item.dateAcquired
                      ? format(item.dateAcquired, "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>{item.propertyNumber ?? "—"}</TableCell>
                  <TableCell>{item.serialNumber ?? "—"}</TableCell>
                  <TableCell>{item.estimatedUsefulLife ?? "—"}</TableCell>
                  <TableCell>{item.assignedTo ?? "—"}</TableCell>
                  <TableCell>{item.remarks ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleDelete(item.id, item.description)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center w-full min-w-0">
        <AddEquipmentItemDialog icsId={icsId} />
        <Button variant="outline" disabled={isPending} onClick={handlePrint}>
          <FileText className="w-4 h-4" /> Print ICS
        </Button>
      </div>
    </div>
  );
}
