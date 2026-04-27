"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Icon,
  Input,
  Badge,
  Tabs,
} from "@shohojdhara/atomix";
import { NetworkMapDataProvider, MapCanvas } from "@/modules/network-map/components";

export default function NetworkMapPage() {
  const [activeTool, setActiveTool] = useState<string>("select");
  const [selectedElement, setSelectedElement] = useState<string | null>("Node Alpha");
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [layers, setLayers] = useState({
    fiberRoutes: true,
    nodesSplitters: true,
    outages: false,
  });

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <NetworkMapDataProvider>
      <div className="u-w-100 u-h-100 u-relative u-bg-dark u-overflow-hidden" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Map Canvas */}
        <MapCanvas />

        {/* Top Search & Toolbar */}
        <div className="u-absolute u-top-0 u-start-0 u-w-100 u-p-4 u-z-1 u-flex u-justify-between u-items-start u-pointer-events-none">
          {/* Search Panel */}
          <div className="u-w-25 u-min-w-0 u-pointer-events-auto">
            <Card appearance="elevated" glass={true} className="u-shadow-lg">
              <Input
                placeholder="Search assets, routes, or customers..."
                prefixIcon={<Icon name="MagnifyingGlass" />}
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search network assets"
              />
            </Card>
          </div>

          {/* Action Toolbar */}
          <div className="u-pointer-events-auto u-flex u-gap-2">
            <Card appearance="elevated" glass={true} className="u-p-2 u-shadow-lg u-flex u-gap-2">
              <Button
                variant={activeTool === "select" ? "primary" : "secondary"}
                size="sm"
                iconName="CursorClick"
                onClick={() => setActiveTool("select")}
                aria-label="Select tool"
                aria-pressed={activeTool === "select"}
              />
              <Button
                variant={activeTool === "trace" ? "primary" : "secondary"}
                size="sm"
                iconName="GitBranch"
                onClick={() => setActiveTool("trace")}
                aria-label="Trace route tool"
                aria-pressed={activeTool === "trace"}
              />
              <Button
                variant={activeTool === "measure" ? "primary" : "secondary"}
                size="sm"
                iconName="Ruler"
                onClick={() => setActiveTool("measure")}
                aria-label="Measure distance tool"
                aria-pressed={activeTool === "measure"}
              />
              <Button
                variant={activeTool === "heatmap" ? "primary" : "secondary"}
                size="sm"
                iconName="Fire"
                onClick={() => setActiveTool("heatmap")}
                aria-label="Heatmap view"
                aria-pressed={activeTool === "heatmap"}
              />
            </Card>

            <Card appearance="elevated" glass={true} className="u-p-2 u-shadow-lg u-flex u-flex-column u-gap-2">
              <Button variant="secondary" size="sm" iconName="Plus" aria-label="Zoom in" />
              <Button variant="secondary" size="sm" iconName="Minus" aria-label="Zoom out" />
              <Button variant="secondary" size="sm" iconName="Compass" aria-label="Reset orientation" />
            </Card>
          </div>
        </div>

        {/* Layer Controls - Bottom Left */}
        <div className="u-absolute u-bottom-0 u-start-0 u-p-4 u-z-1 u-pointer-events-auto">
          <Card appearance="elevated" glass={true} className="u-shadow-lg">
            <h3 className="u-font-bold u-fs-sm u-mb-2">Map Layers</h3>
            <div className="u-flex u-flex-column u-gap-2">
              <label className="u-flex u-items-center u-gap-2 u-fs-sm u-cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.fiberRoutes}
                  onChange={() => handleLayerToggle("fiberRoutes")}
                  aria-label="Toggle fiber routes layer"
                />
                Fiber Routes
              </label>
              <label className="u-flex u-items-center u-gap-2 u-fs-sm u-cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.nodesSplitters}
                  onChange={() => handleLayerToggle("nodesSplitters")}
                  aria-label="Toggle nodes and splitters layer"
                />
                Nodes & Splitters
              </label>
              <label className="u-flex u-items-center u-gap-2 u-fs-sm u-cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.outages}
                  onChange={() => handleLayerToggle("outages")}
                  aria-label="Toggle outages layer"
                />
                Outages
              </label>
            </div>
          </Card>
        </div>

        {/* Inspector Panel - Right Side */}
        {selectedElement && (
          <div
            className="u-absolute u-top-0 u-end-0 u-h-100 u-p-4 u-z-1 u-pointer-events-auto"
            style={{ width: "320px" }}
          >
            <Card appearance="elevated" glass={true} className="u-shadow-lg u-h-100 u-flex u-flex-column">
              <div className="u-flex u-justify-between u-items-center u-mb-4">
                <h2 className="u-font-bold u-fs-lg">Inspector</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  iconName="X"
                  onClick={() => setSelectedElement(null)}
                  aria-label="Close inspector"
                />
              </div>

              <div className="u-bg-primary-subtle u-p-3 u-rounded u-mb-4">
                <div className="u-fs-sm u-text-secondary-subtle">Selected Asset</div>
                <div className="u-font-bold u-fs-base">{selectedElement}</div>
                <Badge variant="success" className="u-mt-2" label="Active" />
              </div>

              <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
                <Tabs.List className="u-mb-4">
                  <Tabs.Trigger index={0}>Details</Tabs.Trigger>
                  <Tabs.Trigger index={1}>Links</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Panels>
                  <Tabs.Panel index={0}>
                    <div className="u-flex u-justify-between u-border-bottom u-border-secondary-subtle u-py-2">
                      <span className="u-text-secondary-subtle u-fs-sm">Type</span>
                      <span className="u-font-bold u-fs-sm">Distribution Node</span>
                    </div>
                    <div className="u-flex u-justify-between u-border-bottom u-border-secondary-subtle u-py-2">
                      <span className="u-text-secondary-subtle u-fs-sm">Capacity</span>
                      <span className="u-font-bold u-fs-sm">64 / 128 Ports</span>
                    </div>
                    <div className="u-flex u-justify-between u-py-2">
                      <span className="u-text-secondary-subtle u-fs-sm">Coordinates</span>
                      <span className="u-font-mono u-fs-xs">40.7128, -74.0060</span>
                    </div>
                  </Tabs.Panel>
                  <Tabs.Panel index={1}>
                    <div className="u-fs-sm u-text-secondary-subtle">No active routes traced.</div>
                  </Tabs.Panel>
                </Tabs.Panels>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </NetworkMapDataProvider>
  );
}
