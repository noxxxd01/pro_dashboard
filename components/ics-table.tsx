"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { PaginationComponent } from "./pagination";
import { Button } from "./ui/button";
import { EllipsisVertical, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import CreateIcsDialog from "./create-ics-dialog";
import { deleteICS } from "@/app/actions/equipment-actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface IcsSummary {
  id: string;
  icsNumber: string;
  office: string;
  poNumber: string | null;
  province: string | null;
  date: Date;
  itemCount: number;
}

interface IcsTableProps {
  slips: IcsSummary[];
  currentPage: number;
  totalPages: number;
}

export default function IcsTable({
  slips,
  currentPage,
  totalPages,
}: IcsTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, office: string) => {
    startTransition(async () => {
      const result = await deleteICS(id);
      if (result.success) {
        toast.success(`ICS for "${office}" deleted`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar">
        <Table className="w-max min-w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-32">ICS No.</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>PO No.</TableHead>
              <TableHead>Province</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No ICS records yet. Click &quot;Create ICS&quot; to start
                  one.
                </TableCell>
              </TableRow>
            ) : (
              slips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-medium py-4">
                    <Link
                      href={`/equipment-monitoring/${slip.id}`}
                      className="text-primary hover:underline underline-offset-2"
                    >
                      {slip.icsNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{slip.office}</TableCell>
                  <TableCell>{slip.poNumber ?? "—"}</TableCell>
                  <TableCell>{slip.province ?? "—"}</TableCell>
                  <TableCell>{format(slip.date, "MMM d, yyyy")}</TableCell>
                  <TableCell>{slip.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" disabled={isPending}>
                          <EllipsisVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(slip.id, slip.office)}
                          >
                            <Trash className="w-4 h-4 text-destructive" />{" "}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center w-full min-w-0">
        <div>
          <CreateIcsDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
