"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { EllipsisVertical, Filter, Trash, X } from "lucide-react";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import AddSupplyDialog from "./add-supply-dialog";
import { PaginationComponent } from "./pagination";
import { deleteSupply } from "@/app/actions/supply-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SupplyTableProps } from "@/lib/types";

export default function SupplyTable({
  supplies,
  categoryOptions,
  currentSearch,
  currentCategory,
  currentPage,
  totalPages,
}: SupplyTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 whenever search/category changes, unless we're explicitly changing the page itself
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput });
  };

  const handleCategoryChange = (value: string) => {
    updateParams({ category: value === "all" ? "" : value });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    router.push("?");
  };

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteSupply(id);
      if (result.success) {
        toast.success(`"${name}" deleted`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const hasActiveFilters = currentSearch || currentCategory;

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex flex-row items-center gap-2">
        <Select
          value={currentCategory || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Field orientation="horizontal" className="w-80">
          <Input
            type="search"
            placeholder="Search supply name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button onClick={handleSearch}>Search</Button>
        </Field>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters}>
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>
      <div className="w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar">
        <Table className="w-max min-w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-25">Supply ID</TableHead>
              <TableHead>Supply Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Quantity</TableHead>
              <TableHead>Stock In Date</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {hasActiveFilters
                    ? "No supplies match your search/filter."
                    : 'No supplies yet. Click "Add a Supply" to create one.'}
                </TableCell>
              </TableRow>
            ) : (
              supplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium py-4">
                    {supply.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{supply.name}</TableCell>
                  <TableCell>{supply.size ?? "—"}</TableCell>
                  <TableCell>{supply.unit ?? "—"}</TableCell>
                  <TableCell>{supply.category?.name ?? "—"}</TableCell>
                  <TableCell>{supply.stockQuantity}</TableCell>
                  <TableCell>
                    {supply.stockInDate
                      ? format(supply.stockInDate, "MMM d, yyyy")
                      : "—"}
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
                            onClick={() => handleDelete(supply.id, supply.name)}
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
          <AddSupplyDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
