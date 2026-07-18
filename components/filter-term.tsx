"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { FilterIcon, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentTerm } from "@/lib/term";

const CURRENT_TERM = getCurrentTerm();
const YEAR_OPTIONS = Array.from(
  { length: 4 },
  (_, i) => CURRENT_TERM.year - 2 + i,
);

export default function FilterTerm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = searchParams.get("year") ?? String(CURRENT_TERM.year);
  const semester = searchParams.get("semester") ?? CURRENT_TERM.semester;
  const hasActiveFilter = Boolean(
    searchParams.get("year") || searchParams.get("semester"),
  );

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleYearChange = (value: string) => {
    updateParams({ year: value });
  };

  const handleSemesterChange = (value: string) => {
    updateParams({
      semester: value,
      year,
    });
  };

  const clearFilter = () => {
    updateParams({ year: null, semester: null });
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={hasActiveFilter ? "default" : "outline"}>
            <FilterIcon className="h-4 w-4" /> {semester} semester {year}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Year</SelectLabel>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Term</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={semester}
              onValueChange={handleSemesterChange}
            >
              <DropdownMenuRadioItem value="1st">
                1st semester
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="2nd">
                2nd semester
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          {hasActiveFilter && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={clearFilter}>
                  <X className="h-4 w-4" /> Reset
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
