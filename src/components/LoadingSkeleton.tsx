"use client";

import { Card, Grid, GridCol } from "@shohojdhara/atomix";

interface SkeletonProps {
  type?: "card" | "table" | "chart" | "page";
  count?: number;
}

export function LoadingSkeleton({ type = "card", count = 1 }: SkeletonProps) {
  if (type === "page") {
    return (
      <div className="u-py-6 u-w-100">
        {/* Header skeleton */}
        <div className="u-mb-6">
          <div
            className="u-bg-secondary-subtle u-rounded u-mb-2"
            style={{ height: "32px", width: "40%" }}
          />
          <div
            className="u-bg-secondary-subtle u-rounded"
            style={{ height: "16px", width: "60%" }}
          />
        </div>

        {/* Stats cards skeleton */}
        <Grid className="u-mb-6">
          {[1, 2, 3, 4].map((i) => (
            <GridCol xs={12} sm={6} lg={3} key={i}>
              <Card>
                <div className="u-flex u-items-center u-gap-3 u-mb-3">
                  <div
                    className="u-bg-secondary-subtle u-rounded"
                    style={{ width: "48px", height: "48px" }}
                  />
                  <div className="u-flex-grow-1">
                    <div
                      className="u-bg-secondary-subtle u-rounded u-mb-2"
                      style={{ height: "12px", width: "60%" }}
                    />
                    <div
                      className="u-bg-secondary-subtle u-rounded"
                      style={{ height: "24px", width: "40%" }}
                    />
                  </div>
                </div>
                <div
                  className="u-bg-secondary-subtle u-rounded"
                  style={{ height: "12px", width: "50%" }}
                />
              </Card>
            </GridCol>
          ))}
        </Grid>

        {/* Content skeleton */}
        <Grid>
          <GridCol xs={12} lg={8}>
            <Card>
              <div
                className="u-bg-secondary-subtle u-rounded u-mb-4"
                style={{ height: "24px", width: "30%" }}
              />
              <div
                className="u-bg-secondary-subtle u-rounded"
                style={{ height: "300px" }}
              />
            </Card>
          </GridCol>
          <GridCol xs={12} lg={4}>
            <Card>
              <div
                className="u-bg-secondary-subtle u-rounded u-mb-4"
                style={{ height: "24px", width: "40%" }}
              />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="u-bg-secondary-subtle u-rounded u-mb-3"
                  style={{ height: "80px" }}
                />
              ))}
            </Card>
          </GridCol>
        </Grid>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="u-w-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="u-flex u-items-center u-gap-4 u-py-3 u-border-bottom u-border-secondary-subtle"
          >
            <div
              className="u-bg-secondary-subtle u-rounded"
              style={{ height: "16px", width: "20%" }}
            />
            <div
              className="u-bg-secondary-subtle u-rounded"
              style={{ height: "16px", width: "30%" }}
            />
            <div
              className="u-bg-secondary-subtle u-rounded"
              style={{ height: "16px", width: "15%" }}
            />
            <div
              className="u-bg-secondary-subtle u-rounded"
              style={{ height: "16px", width: "25%" }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Default card skeletons
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="u-mb-3">
          <div
            className="u-bg-secondary-subtle u-rounded u-mb-2"
            style={{ height: "16px", width: "60%" }}
          />
          <div
            className="u-bg-secondary-subtle u-rounded u-mb-2"
            style={{ height: "12px", width: "80%" }}
          />
          <div
            className="u-bg-secondary-subtle u-rounded"
            style={{ height: "12px", width: "40%" }}
          />
        </Card>
      ))}
    </>
  );
}
