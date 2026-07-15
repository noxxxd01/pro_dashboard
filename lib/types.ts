import type { Prisma } from "./generated/prisma/client";

export type Label = Prisma.LabelGetPayload<{
  include: {
    options: {
      include: {
        relationsFrom: { include: { relatedOption: true } };
      };
    };
  };
}>;

export interface OptionSummary {
  id: string;
  name: string;
}

export interface RelationField {
  id: string;
  key: string;
}

export interface LabelGroup {
  id: string;
  name: string;
  options: { id: string; name: string }[];
}

export interface TableActionsProps {
  activityId: string;
  activityName: string;
}

export interface DataTableProjectsProps {
  bureauName: string;
  searchParams?: { page?: string; year?: string; semester?: string };
}

export interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
}

export interface ModeOfImplementationData {
  mode: string;
  count: number;
}

export interface TargetAccomplishmentData {
  indicator: string;
  semester: string;
  target: number;
  accomplished: number;
  projectName: string | null;
}

export interface Supply {
  id: string;
  name: string;
  size: string | null;
  category: { id: string; name: string } | null;
  stockQuantity: number;
  stockInDate: Date | null;
}

export interface OptionSummary {
  id: string;
  name: string;
}

export interface SupplyTableProps {
  supplies: Supply[];
  categoryOptions: OptionSummary[];
  currentSearch: string;
  currentCategory: string;
  currentPage: number;
  totalPages: number;
}

export type Option = Label["options"][number];
export type OptionRelation = Option["relationsFrom"][number];
