"use client";

import { useMemo, useRef } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, WheelEvent } from "react";
import { NetworkStatus } from "../types";
import type { NetworkConnection } from "../types";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import {
  isCoverageLayerVisible,
  isOutagesLayerVisible,
  visibleConnectionTypesFromLayers,
  visibleNodeTypesFromLayers,
} from "../utils/layerVisibility";
import styles from "./OfflineMapCanvas.module.css";

const WIDTH = 1000;
const HEIGHT = 700;
const STATUS_COLORS: Record<NetworkStatus, string> = {
  [NetworkStatus.ACTIVE]: "#39e7ad",
  [NetworkStatus.INACTIVE]: "#718096",
  [NetworkStatus.WARNING]: "#ffb454",
  [NetworkStatus.DEGRADED]: "#ff875f",
  [NetworkStatus.ERROR]: "#ff5875",
};

const streets = [
  "M-80 84 C 175 120 218 55 392 118 S 688 144 1080 80",
  "M-80 226 C 156 180 274 262 449 215 S 774 198 1080 268",
  "M-80 370 C 194 322 303 401 520 354 S 787 330 1080 400",
  "M-80 522 C 175 474 324 553 515 510 S 808 478 1080 560",
  "M-80 654 C 185 598 336 686 510 645 S 814 609 1080 692",
  "M112 -80 C 155 124 84 213 132 368 S 196 565 167 780",
  "M346 -80 C 300 112 394 220 348 384 S 314 565 366 780",
  "M585 -80 C 625 126 535 224 590 397 S 641 575 584 780",
  "M818 -80 C 770 120 859 239 815 390 S 774 582 838 780",
];

function routePath(
  connection: NetworkConnection,
  positions: Map<string, { x: number; y: number }>
) {
  const routePoints = connection.route?.length
    ? connection.route.map((point) => point)
    : [];
  const points =
    routePoints.length > 1
      ? routePoints.map((point) => positions.get(`${point.lat}:${point.lng}`))
      : [
          positions.get(connection.sourceNodeId),
          positions.get(connection.targetNodeId),
        ];
  const validPoints = points.filter(
    (point): point is { x: number; y: number } => point !== undefined
  );
  if (validPoints.length < 2) return null;
  return validPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
}

function getBuildings() {
  return Array.from({ length: 52 }, (_, index) => {
    const column = index % 10;
    const row = Math.floor(index / 10);
    const x = 34 + column * 101 + ((row * 17 + column * 9) % 22);
    const y = 34 + row * 126 + ((column * 11 + row * 13) % 24);
    const width = 24 + ((index * 7) % 25);
    const height = 17 + ((index * 11) % 31);
    return `${x},${y} ${x + width},${y - 3} ${x + width + 4},${y + height} ${x + 2},${y + height + 4}`;
  });
}

const buildings = getBuildings();

export function OfflineMapCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    center: { lat: number; lng: number };
  } | null>(null);
  const didDragRef = useRef(false);
  const nodes = useNetworkMapStore((state) => state.nodes);
  const connections = useNetworkMapStore((state) => state.connections);
  const layers = useNetworkMapStore((state) => state.layers);
  const viewport = useNetworkMapStore((state) => state.viewport);
  const selectedElementId = useNetworkMapStore(
    (state) => state.interaction.selectedElementId
  );
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const style = useNetworkMapStore((state) => state.offlineMapStyle);
  const buildingsVisible = useNetworkMapStore(
    (state) => state.offlineBuildingsVisible
  );
  const setSelectedElement = useNetworkMapStore(
    (state) => state.setSelectedElement
  );
  const setHoveredElement = useNetworkMapStore((state) => state.setHoveredElement);
  const setViewport = useNetworkMapStore((state) => state.setViewport);
  const setDragging = useNetworkMapStore((state) => state.setDragging);
  const addToSelectionHistory = useNetworkMapStore(
    (state) => state.addToSelectionHistory
  );
  const addMeasurement = useNetworkMapStore((state) => state.addMeasurement);
  const addPlanRouteWaypoint = useNetworkMapStore(
    (state) => state.addPlanRouteWaypoint
  );
  const setPlanPendingArea = useNetworkMapStore(
    (state) => state.setPlanPendingArea
  );
  const setImpairmentArea = useNetworkMapStore(
    (state) => state.setImpairmentArea
  );

  const visibleNodes = useMemo(() => {
    const allowedTypes = new Set(visibleNodeTypesFromLayers(layers));
    return nodes.filter((node) => allowedTypes.has(node.type));
  }, [nodes, layers]);
  const visibleConnections = useMemo(() => {
    const allowedTypes = new Set(visibleConnectionTypesFromLayers(layers));
    const outagesVisible = isOutagesLayerVisible(layers);
    return connections.filter(
      (connection) =>
        connection.status === NetworkStatus.ERROR
          ? outagesVisible
          : allowedTypes.has(connection.type)
    );
  }, [connections, layers]);
  const showCoverage = isCoverageLayerVisible(layers);

  const geography = useMemo(() => {
    const points = nodes.map((node) => node.position);
    if (!points.length) {
      return { lat: viewport.center.lat, lng: viewport.center.lng, latSpan: 0.02, lngSpan: 0.02 };
    }
    const latitudes = points.map((point) => point.lat);
    const longitudes = points.map((point) => point.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latSpan = Math.max(maxLat - minLat, 0.006) * 1.22;
    const lngSpan = Math.max(maxLng - minLng, 0.008) * 1.22;
    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
      latSpan,
      lngSpan,
    };
  }, [nodes, viewport.center.lat, viewport.center.lng]);

  const scaleX = (WIDTH * 0.88) / geography.lngSpan;
  const scaleY = (HEIGHT * 0.88) / geography.latSpan;
  const positions = useMemo(() => {
    const positionMap = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      positionMap.set(node.id, {
        x: WIDTH / 2 + (node.position.lng - geography.lng) * scaleX,
        y: HEIGHT / 2 - (node.position.lat - geography.lat) * scaleY,
      });
    });
    connections.forEach((connection) => {
      connection.route?.forEach((point) => {
        positionMap.set(`${point.lat}:${point.lng}`, {
          x: WIDTH / 2 + (point.lng - geography.lng) * scaleX,
          y: HEIGHT / 2 - (point.lat - geography.lat) * scaleY,
        });
      });
    });
    return positionMap;
  }, [nodes, connections, geography, scaleX, scaleY]);

  const positionedConnections = useMemo(
    () =>
      visibleConnections
        .map((connection) => ({
          connection,
          path: routePath(connection, positions),
        }))
        .filter(
          (entry): entry is { connection: NetworkConnection; path: string } =>
            entry.path !== null
        ),
    [visibleConnections, positions]
  );
  const coreRoutes = positionedConnections
    .filter(({ connection }) => connection.type === "fiber_route")
    .slice(0, 20);
  const zoom = Math.pow(2, viewport.zoom - 15);
  const centerX = WIDTH / 2 + (viewport.center.lng - geography.lng) * scaleX;
  const centerY = HEIGHT / 2 - (viewport.center.lat - geography.lat) * scaleY;
  const transform = `translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${zoom}) translate(${-centerX} ${-centerY})`;
  const counts = useMemo(
    () => ({
      active: nodes.filter((node) => node.status === NetworkStatus.ACTIVE).length,
      issues: nodes.filter(
        (node) =>
          node.status === NetworkStatus.ERROR ||
          node.status === NetworkStatus.WARNING ||
          node.status === NetworkStatus.DEGRADED
      ).length,
    }),
    [nodes]
  );

  const selectElement = (id: string) => {
    setSelectedElement(id);
    addToSelectionHistory(id);
  };

  const getSvgPoint = (event: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const localPoint = point.matrixTransform(matrix.inverse());
    return { x: localPoint.x, y: localPoint.y };
  };

  const getMapPosition = (x: number, y: number) => {
    const mapX = (x - WIDTH / 2) / zoom + centerX;
    const mapY = (y - HEIGHT / 2) / zoom + centerY;
    return {
      lng: geography.lng + (mapX - WIDTH / 2) / scaleX,
      lat: geography.lat - (mapY - HEIGHT / 2) / scaleY,
    };
  };

  const handleMapClick = (event: MouseEvent<SVGSVGElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (activeTool === "select" || activeTool === "trace" || activeTool === "heatmap") {
      if (activeTool === "select") setSelectedElement(null);
      return;
    }
    const point = getSvgPoint(event);
    if (!point) return;
    const position = getMapPosition(point.x, point.y);
    if (activeTool === "measure") {
      addMeasurement({ id: crypto.randomUUID(), position, timestamp: new Date() });
    } else if (activeTool === "plan") {
      if (useNetworkMapStore.getState().planDrawMode === "route") {
        addPlanRouteWaypoint(position);
      } else {
        setPlanPendingArea({ center: position, radiusMeters: 250 });
      }
    } else if (activeTool === "impairment") {
      setImpairmentArea({ center: position, radius: 250 });
    }
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      center: viewport.center,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) didDragRef.current = true;
    if (!didDragRef.current) return;
    setDragging(true);
    setViewport({
      center: {
        lng: dragRef.current.center.lng - deltaX / (scaleX * zoom),
        lat: dragRef.current.center.lat + deltaY / (scaleY * zoom),
      },
    });
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setViewport({
      zoom: Math.max(2, Math.min(18, viewport.zoom + (event.deltaY < 0 ? 0.5 : -0.5))),
    });
  };

  return (
    <div className={`${styles.canvas} ${style === "terrain" ? styles.terrain : ""}`}>
      <svg
        ref={svgRef}
        className={styles.map}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        role="application"
        aria-label="Offline network map with simulated local topology"
        onClick={handleMapClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="offline-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" className={styles.minorGrid} />
          </pattern>
          <radialGradient id="offline-vignette">
            <stop offset="45%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(3, 10, 19, .58)" />
          </radialGradient>
          <filter id="offline-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={WIDTH} height={HEIGHT} className={styles.ground} />
        <rect width={WIDTH} height={HEIGHT} fill="url(#offline-grid)" />
        <g transform={transform}>
          {buildingsVisible &&
            buildings.map((points, index) => (
              <polygon
                key={index}
                points={points}
                className={styles.building}
                style={{ animationDelay: `${(index % 9) * 110}ms` }}
              />
            ))}
          {streets.map((path, index) => (
            <g key={path}>
              <path d={path} className={index % 2 ? styles.streetEdge : styles.arterialEdge} />
              <path d={path} className={index % 2 ? styles.street : styles.arterial} />
            </g>
          ))}
          <path
            d="M-50 420 C 200 300 380 468 542 338 S 824 252 1050 316"
            className={styles.river}
          />
          <path
            d="M-50 420 C 200 300 380 468 542 338 S 824 252 1050 316"
            className={styles.riverHighlight}
          />
          <text x="250" y="105" className={styles.mapLabel}>NORTH EXCHANGE DISTRICT</text>
          <text x="480" y="598" className={styles.mapLabel}>RIVERFRONT SERVICE ZONE</text>
          {showCoverage &&
            visibleNodes
              .filter((node) => node.type === "pop" || node.type === "core_node")
              .map((node) => {
                const point = positions.get(node.id);
                return point ? (
                  <circle
                    key={`coverage-${node.id}`}
                    cx={point.x}
                    cy={point.y}
                    r="76"
                    className={styles.coverage}
                  />
                ) : null;
              })}
          {positionedConnections.map(({ connection, path }) => {
            const selected = selectedElementId === connection.id;
            return (
              <path
                key={connection.id}
                d={path}
                className={`${connection.type === "fiber_route" ? styles.fiber : styles.drop} ${selected ? styles.selectedLink : ""} ${connection.status === NetworkStatus.ERROR ? styles.errorLink : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (didDragRef.current) {
                    didDragRef.current = false;
                    return;
                  }
                  selectElement(connection.id);
                }}
                onMouseEnter={() => setHoveredElement(connection.id)}
                onMouseLeave={() => setHoveredElement(null)}
              />
            );
          })}
          {coreRoutes.map(({ connection, path }, index) => (
            <circle
              key={`pulse-${connection.id}`}
              r={index % 3 === 0 ? 3.4 : 2.5}
              className={styles.packet}
              style={{ offsetPath: `path("${path}")`, animationDelay: `${index * -370}ms` } as CSSProperties}
            />
          ))}
          {visibleNodes.map((node) => {
            const point = positions.get(node.id);
            if (!point) return null;
            const isCore = node.type === "core_node" || node.type === "pop";
            const selected = selectedElementId === node.id;
            const color = STATUS_COLORS[node.status];
            return (
              <g
                key={node.id}
                transform={`translate(${point.x} ${point.y})`}
                className={styles.node}
                onClick={(event) => {
                  event.stopPropagation();
                  if (didDragRef.current) {
                    didDragRef.current = false;
                    return;
                  }
                  selectElement(node.id);
                }}
                onMouseEnter={() => setHoveredElement(node.id)}
                onMouseLeave={() => setHoveredElement(null)}
                role="button"
                aria-label={`${node.name}, ${node.type.replaceAll("_", " ")}, ${node.status}`}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectElement(node.id);
                  }
                }}
              >
                {isCore && (
                  <>
                    <circle r="17" fill={color} opacity=".12" filter="url(#offline-glow)" className={styles.pulse} />
                    <circle r="10" className={styles.coreRing} />
                    <circle r="4.5" fill={color} />
                  </>
                )}
                {!isCore && (
                  <>
                    <circle r={selected ? 7 : 5} fill={color} opacity=".19" />
                    <circle r={selected ? 3.4 : 2.2} fill={color} />
                  </>
                )}
                {selected && <circle r={isCore ? 22 : 9} className={styles.selectionRing} />}
              </g>
            );
          })}
        </g>
        <rect width={WIDTH} height={HEIGHT} fill="url(#offline-vignette)" pointerEvents="none" />
      </svg>
      <div className={styles.topLabel}>
        <span className={styles.liveDot} />
        <span>LOCAL NETWORK SIMULATION</span>
        <span className={styles.separator}>/</span>
        <span>NO MAP TILES</span>
      </div>
      <div className={styles.metrics} aria-live="polite">
        <span><i className={styles.activeDot} />{counts.active.toLocaleString()} ACTIVE NODES</span>
        <span><i className={styles.issueDot} />{counts.issues} NEED ATTENTION</span>
        <span className={styles.networkStatus}>●&nbsp; MOCK TOPOLOGY</span>
      </div>
      <div className={styles.scale}><span />500 m</div>
    </div>
  );
}
