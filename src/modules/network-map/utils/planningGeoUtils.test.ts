import { describe, expect, it } from "vitest";
import {
  isPlanGeometryDirty,
  routeWaypointsToGeoJSON,
} from "./planningGeoUtils";

describe("routeWaypointsToGeoJSON", () => {
  it("returns only point features for a single waypoint", () => {
    const result = routeWaypointsToGeoJSON(
      [{ lat: 40.7, lng: -74.0 }],
      "pending"
    );

    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry.type).toBe("Point");
  });

  it("includes a line feature when two or more waypoints exist", () => {
    const result = routeWaypointsToGeoJSON(
      [
        { lat: 40.7, lng: -74.0 },
        { lat: 40.71, lng: -74.01 },
      ],
      "pending"
    );

    expect(result.features).toHaveLength(3);
    expect(
      result.features.some(
        (feature) => feature.geometry.type === "LineString"
      )
    ).toBe(true);
  });
});

describe("isPlanGeometryDirty", () => {
  it("detects draft changes against saved geometry", () => {
    const savedAreas = [
      { type: "circle" as const, center: { lat: 1, lng: 2 }, radiusMeters: 500 },
    ];
    const savedRoutes = [{ waypoints: [{ lat: 3, lng: 4 }, { lat: 5, lng: 6 }] }];

    expect(
      isPlanGeometryDirty(savedAreas, savedRoutes, savedAreas, savedRoutes)
    ).toBe(false);

    expect(
      isPlanGeometryDirty(
        [
          {
            type: "circle" as const,
            center: { lat: 1, lng: 2 },
            radiusMeters: 750,
          },
        ],
        savedRoutes,
        savedAreas,
        savedRoutes
      )
    ).toBe(true);
  });
});
