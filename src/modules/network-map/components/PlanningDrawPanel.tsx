"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Callout, Card, Icon } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useUpdatePlanningProposal } from "@/modules/planning/hooks/usePlanningProposalsData";
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
  const commitPlanPendingArea = useNetworkMapStore(
    (state) => state.commitPlanPendingArea
  );
  const commitPlanRoute = useNetworkMapStore((state) => state.commitPlanRoute);
  const planDraftAreas = useNetworkMapStore((state) => state.planDraftAreas);
  const planDraftRoutes = useNetworkMapStore((state) => state.planDraftRoutes);
  const activePlanningProposalId = useNetworkMapStore(
    (state) => state.activePlanningProposalId
  );
  const setPlanningOverlays = useNetworkMapStore(
    (state) => state.setPlanningOverlays
  );

  const { mutateAsync: updateProposal, isPending, isError, error } =
    useUpdatePlanningProposal();

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleModeChange = (mode: PlanDrawMode) => {
    setPlanDrawMode(mode);
    setPlanPendingArea(null);
    clearPlanRouteWaypoints();
  };

  const handleSave = async () => {
    if (!activePlanningProposalId) {
      setFeedback("No active proposal. Open a proposal in edit mode first.");
      return;
    }

    setFeedback(null);
    const updated = await updateProposal({
      id: activePlanningProposalId,
      data: {
        areas: planDraftAreas,
        routes: planDraftRoutes,
      },
    });
    setPlanningOverlays([updated]);
    setFeedback("Geometry saved to proposal.");
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
                Click the map to place an expansion area center.
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

          {isError && (
            <Callout variant="error" title="Save failed" className="u-mb-3">
              <p className="u-text-sm u-mb-0">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
            </Callout>
          )}

          {feedback && (
            <Callout variant="success" title="Saved" className="u-mb-3">
              <p className="u-text-sm u-mb-0">{feedback}</p>
            </Callout>
          )}

          <Button
            variant="primary"
            className="u-w-100"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save to Proposal"}
          </Button>
        </>
      )}
    </Card>
  );
}
