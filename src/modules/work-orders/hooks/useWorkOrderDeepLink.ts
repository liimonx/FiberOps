"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const WORK_ORDER_SELECTED_PARAM = "selected";

type UseWorkOrderDeepLinkOptions = {
  onSelect: (id: string) => void;
};

export function useWorkOrderDeepLink({ onSelect }: UseWorkOrderDeepLinkOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  const selectedId = searchParams.get(WORK_ORDER_SELECTED_PARAM);
  const incidentId = searchParams.get("incidentId");

  useEffect(() => {
    if (!selectedId) return;
    if (handledRef.current === selectedId) return;

    handledRef.current = selectedId;
    onSelect(selectedId);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(WORK_ORDER_SELECTED_PARAM);
    const query = nextParams.toString();
    router.replace(query ? `/work-orders?${query}` : "/work-orders", {
      scroll: false,
    });
  }, [selectedId, onSelect, router, searchParams]);

  return { incidentId };
}
