"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Plus, Trash, X } from "lucide-react";
import { deleteLabel } from "@/app/actions/label-action";
import OptionAddDialog from "./option-add-dialog";
import { deleteOption } from "@/app/actions/option-actions";
import { Label } from "@/lib/types";

export function LabelCard({ label }: { label: Label }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLabel(label.id);
      if (result.success) {
        toast.success(`"${label.name}" deleted`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  const handleDeleteOption = (optionId: string, optionName: string) => {
    startTransition(async () => {
      const result = await deleteOption(optionId);
      if (result.success) {
        toast.success(`"${optionName}" removed`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Card className="h-auto mb-auto">
      <CardHeader className="h-4">
        <CardTitle>{label.name}</CardTitle>
        <CardAction>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 -mt-4 -mr-2"
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{label.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this label and all its options.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>
      <CardContent className="border-t pt-2">
        {label.options.length > 0 && (
          <div className="flex flex-col gap-2 mt-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {label.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between border px-2 py-1.5 text-xs"
              >
                <div className="flex flex-col">
                  <span className="text-xs">{option.name}</span>
                  {option.relationsFrom.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {option.relationsFrom
                        .map((r) => r.relatedOption.name)
                        .join(", ")}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4"
                  disabled={isPending}
                  onClick={() => handleDeleteOption(option.id, option.name)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <CardFooter className="p-0 pb-2 mt-4 flex justify-end border-0">
          <OptionAddDialog labelId={label.id} />
        </CardFooter>
      </CardContent>
    </Card>
  );
}
