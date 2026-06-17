"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Callout, Card, Icon } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useUpdatePlanningProposal } from "@/modules/planning/hooks/usePlanningProposalsData";
import { isPlanGeometryDirty } from "../utils/planningGeoUtils";
import type { PlanDrawMode } from "../types";

export function PlanningDrawPanel() {
  const planDrawMode = useNetworkMapStore((state) => state.planDrawMode);
  const setPlanDrawMode = useNetworkMapStore((state) => state.setPlanDrawMode);
  const planPendingArea = useNetworkMapStore((state) => state.planPendingArea);
  const setPlanPendingArea = useNetworkMapStore((state) => state.setPlanPendingArea);
  const planRouteWaypoints = useNetworkMapStore((state) => state.planRouteWaypoints);
  const removeLastPlanRouteWaypoint = useNetworkMapStore(
    (state) => state.removeLastPlanRouteWaypoint
  );
  const clearPlanRouteWaypoints = useNetworkMapStore(
    (state) => state.clearPlanRouteWaypoints
  );
  const clearPlanPendingDraw = useNetworkMapStore(
    (state) => state.clearPlanPendingDraw
  );
  const commitPlanPendingArea = useNetworkMapStore(
    (state) => state.commitPlanPendingArea
  );
  const commitPlanRoute = useNetworkMapStore((state) => state.commitPlanRoute);
  const planDraftAreas = useNetworkMapStore((state) => state.planDraftAreas);
  const planDraftRoutes = useNetworkMapStore((state) => state.planDraftRoutes);
  const activePlanningProposalId = useNetworkMapStore(
    (state) => state.activePlanningProposalId
  );
  const planningOverlays = useNetworkMapStore((state) => state.planningOverlays);
  const setPlanningOverlays = useNetworkMapStore(
    (state) => state.setPlanningOverlays
  );
  const discardPlanDraftChanges = useNetworkMapStore(
    (state) => state.discardPlanDraftChanges
  );

  const { mutateAsync: updateProposal, isPending, isError, error } =
    useUpdatePlanningProposal();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeProposal = useMemo(
    () => planningOverlays.find((item) => item.id === activePlanningProposalId),
    [planningOverlays, activePlanningProposalId]
  );

  const hasUnsavedDraft = useMemo(() => {
    if (!activeProposal) return false;
    return isPlanGeometryDirty(
      planDraftAreas,
      planDraftRoutes,
      activeProposal.areas,
      activeProposal.routes
    );
  }, [activeProposal, planDraftAreas, planDraftRoutes]);

  const hasPendingDraw =
    planPendingArea !== null || planRouteWaypoints.length > 0;

  const handleModeChange = (mode: PlanDrawMode) => {
    if (hasPendingDraw) {
      clearPlanPendingDraw();
    }
    setPlanDrawMode(mode);
  };

  const handleSave = async () => {
    if (!activePlanningProposalId) {
      setSaveError("No active proposal. Open a proposal in edit mode first.");
      return;
    }

    setFeedback(null);
    setSaveError(null);

    try {
      const updated = await updateProposal({
        id: activePlanningProposalId,
        data: {
          areas: planDraftAreas,
          routes: planDraftRoutes,
        },
      });
      setPlanningOverlays([updated]);
      setFeedback("Geometry saved to proposal.");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save geometry."
      );
    }
  };

  return (
    <Card className="u-p-4 u-w-100">
      <div className="u-flex u-items-center u-justify-between u-mb-4">
        <h3 className="u-m-0 u-text-sm u-font-bold u-flex u-items-center u-gap-2">
          <Icon name="Calendar" size={16} />
          Planning Draw
        </h3>
        {activePlanningProposalId && (
          <Link href="/planning" className="u-text-xs u-text-primary">
            Back to Planning
          </Link>
        )}
      </div>

      {!activePlanningProposalId ? (
        <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
          Open a proposal via <strong>Edit on Map</strong> from the Planning page to
          draw expansion geometry.
        </p>
      ) : (
        <>
          {activeProposal && (
            <p className="u-text-xs u-text-secondary-emphasis u-mb-3 u-m-0">
              Editing: <strong>{activeProposal.title}</strong>
              {hasUnsavedDraft ? " (unsaved changes)" : ""}
            </p>
          )}

          <div className="u-flex u-gap-2 u-mb-4">
            <Button
              variant={planDrawMode === "area" ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => handleModeChange("area")}
            >
              Area
            </Button>
            <Button
              variant={planDrawMode === "route" ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => handleModeChange("route")}
            >
              Route
            </Button>
          </div>

          {planDrawMode === "area" ? (
            <div className="u-mb-4">
              <p className="u-text-xs u-text-secondary-emphasis u-mb-2">
                Click the map to place an expansion area center. Press Enter to add
                the area.
              </p>
              {planPendingArea && (
                <>
                  <label className="u-block u-text-xs u-text-secondary u-mb-2">
                    Radius: {planPendingArea.radiusMeters}m
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="50"
                    value={planPendingArea.radiusMeters}
                    onChange={(event) =>
                      setPlanPendingArea({
                        ...planPendingArea,
                        radiusMeters: Number(event.target.value),
                      })
                    }
                    className="u-w-100 u-mb-3"
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={commitPlanPendingArea}
                  >
                    Add Area
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="u-mb-4">
              <p className="u-text-xs u-text-secondary-emphasis u-mb-2">
                Click to add route waypoints ({planRouteWaypoints.length} placed).
                Press Enter to finish the route.
              </p>
              <div className="u-flex u-gap-2 u-flex-wrap">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={removeLastPlanRouteWaypoint}
                  disabled={planRouteWaypoints.length === 0}
                >
                  Undo Waypoint
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={clearPlanRouteWaypoints}
                  disabled={planRouteWaypoints.length === 0}
                >
                  Clear Route
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={commitPlanRoute}
                  disabled={planRouteWaypoints.length < 2}
                >
                  Finish Route
                </Button>
              </div>
            </div>
          )}

          <p className="u-text-xs u-text-secondary-emphasis u-mb-4">
            Draft: {planDraftAreas.length} area(s), {planDraftRoutes.length} route(s)
          </p>

          {(isError || saveError) && (
            <Callout variant="error" title="Save failed" className="u-mb-3">
              <p className="u-text-sm u-mb-0">
                {saveError ??
                  (error instanceof Error ? error.message : "Please try again.")}
              </p>
            </Callout>
          )}

          {feedback && (
            <Callout variant="success" title="Saved" className="u-mb-3">
              <p className="u-text-sm u-mb-0">{feedback}</p>
            </Callout>
          )}

          <div className="u-flex u-gap-2">
            <Button
              variant="primary"
              className="u-flex-1"
              onClick={handleSave}
              disabled={isPending || !hasUnsavedDraft}
            >
              {isPending ? "Saving..." : "Save to Proposal"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={discardPlanDraftChanges}
              disabled={!hasUnsavedDraft && !hasPendingDraw}
            >
              Discard
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
