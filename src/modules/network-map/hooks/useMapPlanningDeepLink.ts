"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import type { Map as MapboxMap } from "mapbox-gl";
import {
  PLANNING_MAP_EDIT_PARAM,
  PLANNING_MAP_QUERY_PARAM,
} from "@/modules/planning/lib/planningMapNavigation";
import {
  usePlanningProposal,
  usePlanningProposals,
} from "@/modules/planning/hooks/usePlanningProposalsData";
import { useNetworkMapStore, useLayers } from "../stores/useNetworkMapStore";
import { isPlanningLayerVisible } from "../utils/layerVisibility";
import { fitMapBounds } from "../utils/mapUtils";
import { collectLatLngPoints } from "../utils/planningGeoUtils";
import { getToolManager } from "../tools/toolManager";

type UseMapPlanningDeepLinkOptions = {
  mapInstance: MapboxMap | null;
};

export function useMapPlanningDeepLink({
  mapInstance,
}: UseMapPlanningDeepLinkOptions) {
  const searchParams = useSearchParams();
  const proposalId = searchParams.get(PLANNING_MAP_QUERY_PARAM);
  const editMode = searchParams.get(PLANNING_MAP_EDIT_PARAM) === "1";
  const handledRef = useRef<string | null>(null);

  const { data: proposal } = usePlanningProposal(proposalId);

  const setPlanningOverlays = useNetworkMapStore(
    (state) => state.setPlanningOverlays
  );
  const setLayerVisibility = useNetworkMapStore(
    (state) => state.setLayerVisibility
  );
  const setPlanDraftFromProposal = useNetworkMapStore(
    (state) => state.setPlanDraftFromProposal
  );
  const setActivePlanningProposalId = useNetworkMapStore(
    (state) => state.setActivePlanningProposalId
  );
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);

  useEffect(() => {
    if (!proposalId || !proposal) return;
    if (handledRef.current === `${proposalId}-${editMode}`) return;

    handledRef.current = `${proposalId}-${editMode}`;

    setPlanningOverlays([proposal]);
    setActivePlanningProposalId(proposal.id);
    setLayerVisibility("planning-proposals", true);

    if (editMode) {
      setPlanDraftFromProposal(proposal);
      setActiveTool("plan");
      getToolManager().setActiveTool("plan");
    }

    if (mapInstance) {
      const points = collectLatLngPoints([proposal], [], [], null, []);
      if (points.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const point of points) {
          bounds.extend([point.lng, point.lat]);
        }
        fitMapBounds(mapInstance, bounds, 80);
      }
    }
  }, [
    proposalId,
    proposal,
    editMode,
    mapInstance,
    setPlanningOverlays,
    setLayerVisibility,
    setPlanDraftFromProposal,
    setActivePlanningProposalId,
    setActiveTool,
  ]);
}

/** Loads all proposals onto the map when the planning layer is visible (no deep link). */
export function usePlanningOverlaysSync() {
  const searchParams = useSearchParams();
  const proposalId = searchParams.get(PLANNING_MAP_QUERY_PARAM);
  const layers = useLayers();
  const planningVisible = isPlanningLayerVisible(layers);
  const { data: proposals } = usePlanningProposals();
  const setPlanningOverlays = useNetworkMapStore(
    (state) => state.setPlanningOverlays
  );

  useEffect(() => {
    if (proposalId) return;
    if (planningVisible && proposals) {
      setPlanningOverlays(proposals);
    }
  }, [proposalId, planningVisible, proposals, setPlanningOverlays]);
}
