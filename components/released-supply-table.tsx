"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "./ui/badge";
import { EllipsisVertical, FileText, Trash, Upload, X } from "lucide-react";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import RequestSupplyDialog from "./request-supply-dialog";
import {
  deleteReleaseBatch,
  generateRIS,
  uploadSignedRis,
  type ReleaseBatchSummary,
} from "@/app/actions/released-supply-actions";
import { getStatusBadgeColor } from "@/lib/badge-colors";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReleasedSupplyTableProps {
  releases: ReleaseBatchSummary[];
  currentSearch: string;
  currentPage: number;
  totalPages: number;
}

export default function ReleasedSupplyTable({
  releases,
  currentSearch,
  currentPage,
  totalPages,
}: ReleasedSupplyTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    updateParams({ releasedSearch: searchInput });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("releasedSearch");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleDelete = (key: string, requesteeName: string) => {
    startTransition(async () => {
      const result = await deleteReleaseBatch(key);
      if (result.success) {
        toast.success(
          `RIS for "${requesteeName}" removed, stock restored`,
        );
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const handleOpenRIS = (key: string) => {
    setOpeningKey(key);
    startTransition(async () => {
      const result = await generateRIS(key);
      setOpeningKey(null);
      if (result.success && result.pdfBase64) {
        const byteCharacters = atob(result.pdfBase64);
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
      } else {
        toast.error(result.error ?? "Failed to generate RIS");
      }
    });
  };

  const handleUploadClick = (key: string) => {
    fileInputRefs.current[key]?.click();
  };

  const handleFileSelected = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    setUploadingKey(key);
    startTransition(async () => {
      const result = await uploadSignedRis(key, formData);
      setUploadingKey(null);
      if (result.success) {
        toast.success("Signed RIS uploaded");
      } else {
        toast.error(result.error ?? "Failed to upload signed RIS");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex flex-row items-center gap-2">
        <Field orientation="horizontal" className="w-80">
          <Input
            type="search"
            placeholder="Search supply or requestee..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button onClick={handleSearch}>Search</Button>
        </Field>
        {currentSearch && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
      <div className="w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar">
        <Table className="w-max min-w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-28">RIS ID</TableHead>
              <TableHead>Requestee</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Signed RIS</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  {currentSearch
                    ? "No release records match your search."
                    : "No supplies have been released yet."}
                </TableCell>
              </TableRow>
            ) : (
              releases.map((release) => (
                <TableRow key={release.key}>
                  <TableCell className="font-medium py-4">
                    <button
                      type="button"
                      onClick={() => handleOpenRIS(release.key)}
                      disabled={isPending && openingKey === release.key}
                      className="cursor-pointer text-primary hover:underline underline-offset-2 disabled:opacity-50"
                    >
                      {openingKey === release.key
                        ? "Opening..."
                        : release.risNumber}
                    </button>
                  </TableCell>
                  <TableCell>{release.requesteeName}</TableCell>
                  <TableCell>{release.approvedByName ?? "—"}</TableCell>
                  <TableCell>{release.issuedByName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeColor(release.status)}
                    >
                      {release.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(release.releasedDate, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {release.signedRisUrl ? (
                        <a
                          href={release.signedRisUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="w-4 h-4 shrink-0" /> View
                        </a>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingKey === release.key}
                          onClick={() => handleUploadClick(release.key)}
                        >
                          <Upload className="w-4 h-4" />
                          {uploadingKey === release.key
                            ? "Uploading..."
                            : "Upload"}
                        </Button>
                      )}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[release.key] = el;
                        }}
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelected(release.key, e)}
                      />
                    </div>
                  </TableCell>
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
                            onClick={() =>
                              handleDelete(release.key, release.requesteeName)
                            }
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
          <RequestSupplyDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
