"use client";

import { Card, Grid, GridCol } from "@shohojdhara/atomix";

interface SkeletonProps {
  type?: "card" | "table" | "chart" | "page";
  count?: number;
}

export function LoadingSkeleton({ type = "card", count = 1 }: SkeletonProps) {
  if (type === "page") {
    return (
      <div className="u-page">
        <div className="u-mb-6">
          <div className="u-skeleton u-h-10 u-w-50 u-mb-2" />
          <div className="u-skeleton u-h-5 u-w-75" />
        </div>

        <Grid className="u-mb-6">
          {[1, 2, 3, 4].map((i) => (
            <GridCol xs={12} sm={6} lg={3} key={i}>
              <Card>
                <div className="u-flex u-items-center u-gap-3 u-mb-3">
                  <div className="u-skeleton u-w-12 u-h-12" />
                  <div className="u-flex-grow-1">
                    <div className="u-skeleton u-h-3 u-w-75 u-mb-2" />
                    <div className="u-skeleton u-h-8 u-w-50" />
                  </div>
                </div>
                <div className="u-skeleton u-h-3 u-w-50" />
              </Card>
            </GridCol>
          ))}
        </Grid>

        <Grid>
          <GridCol xs={12} lg={8}>
            <Card>
              <div className="u-skeleton u-h-8 u-w-25 u-mb-4" />
              <div className="u-skeleton u-h-75" />
            </Card>
          </GridCol>
          <GridCol xs={12} lg={4}>
            <Card>
              <div className="u-skeleton u-h-8 u-w-50 u-mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="u-skeleton u-h-20 u-mb-3" />
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
            <div className="u-skeleton u-h-4 u-w-25" />
            <div className="u-skeleton u-h-4 u-w-50" />
            <div className="u-skeleton u-h-4 u-w-25" />
            <div className="u-skeleton u-h-4 u-w-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="u-mb-3">
          <div className="u-skeleton u-h-4 u-w-75 u-mb-2" />
          <div className="u-skeleton u-h-3 u-w-100 u-mb-2" />
          <div className="u-skeleton u-h-3 u-w-50" />
        </Card>
      ))}
    </>
  );
}
