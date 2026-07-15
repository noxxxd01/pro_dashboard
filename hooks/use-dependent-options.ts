"use client";

import { useEffect, useState } from "react";
import { getRelatedOptions } from "@/app/actions/option-actions";
import type { OptionSummary } from "@/lib/types";

export function useDependentOptions(parentId: string) {
  const [options, setOptions] = useState<OptionSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!parentId) {
      setOptions([]);
      setSelectedId("");
      return;
    }

    let cancelled = false;
    getRelatedOptions(parentId).then((related) => {
      if (!cancelled) {
        setOptions(related);
        // Only clear the selection if it isn't actually among the newly
        // fetched options — preserves a value a caller just restored (e.g.
        // when loading an existing record into an edit form) while still
        // resetting when the user genuinely switches the parent selection.
        setSelectedId((prev) =>
          related.some((o) => o.id === prev) ? prev : "",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [parentId]);

  return { options, selectedId, setSelectedId };
}
