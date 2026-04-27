"use client";

import { NetworkNode, NetworkConnection } from '../types';

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number = 60000): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
export const networkCache = new DataCache(200);

// Utility functions for cache keys
export function createCacheKey(prefix: string, ...parts: Array<string | number>): string {
  return `${prefix}:${parts.join(':')}`;
}

export const cacheKeys = {
  node: (id: string) => createCacheKey('node', id),
  nodesByType: (type: string) => createCacheKey('nodes', 'type', type),
  nodesByStatus: (status: string) => createCacheKey('nodes', 'status', status),
  connection: (id: string) => createCacheKey('connection', id),
  connectionsByNode: (nodeId: string) => createCacheKey('connections', 'node', nodeId),
  searchResults: (query: string) => createCacheKey('search', query),
  viewport: (zoom: number, centerLat: number, centerLng: number) => 
    createCacheKey('viewport', Math.round(zoom), Math.round(centerLat * 100), Math.round(centerLng * 100)),
};

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

// Throttle utility for rate-limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Memoize function with custom key generator
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Batch updates for better performance
export class UpdateBatcher<T extends { id: string }> {
  private buffer: Map<string, Partial<T>> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private flushCallback: (updates: Map<string, Partial<T>>) => void;
  private batchSize: number;
  private batchInterval: number;

  constructor(
    flushCallback: (updates: Map<string, Partial<T>>) => void,
    options: { batchSize?: number; batchInterval?: number } = {}
  ) {
    this.flushCallback = flushCallback;
    this.batchSize = options.batchSize || 50;
    this.batchInterval = options.batchInterval || 1000;
  }

  queue(id: string, updates: Partial<T>): void {
    this.buffer.set(id, { ...this.buffer.get(id), ...updates });

    // Flush immediately if buffer is full
    if (this.buffer.size >= this.batchSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.batchInterval);
    }
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.size > 0) {
      const updates = new Map(this.buffer);
      this.buffer.clear();
      this.flushCallback(updates);
    }
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer.clear();
  }
}

// Spatial index for efficient geographic queries
interface GeoIndexEntry {
  id: string;
  lat: number;
  lng: number;
}

export class SpatialIndex {
  private entries: GeoIndexEntry[] = [];
  private gridSize: number;
  private grid: Map<string, GeoIndexEntry[]> = new Map();

  constructor(gridSize: number = 0.01) {
    this.gridSize = gridSize;
  }

  add(entry: GeoIndexEntry): void {
    this.entries.push(entry);
    const cellKey = this.getCellKey(entry.lat, entry.lng);
    
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    this.grid.get(cellKey)!.push(entry);
  }

  remove(id: string): void {
    const index = this.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      const entry = this.entries[index];
      this.entries.splice(index, 1);
      
      const cellKey = this.getCellKey(entry.lat, entry.lng);
      const cell = this.grid.get(cellKey);
      if (cell) {
        const cellIndex = cell.findIndex(e => e.id === id);
        if (cellIndex !== -1) {
          cell.splice(cellIndex, 1);
        }
      }
    }
  }

  update(entry: GeoIndexEntry): void {
    this.remove(entry.id);
    this.add(entry);
  }

  // Find entries within radius (in degrees, roughly)
  findByRadius(lat: number, lng: number, radius: number): GeoIndexEntry[] {
    const results: GeoIndexEntry[] = [];
    const radiusDeg = radius;
    
    // Check surrounding cells
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        const cellKey = this.getCellKey(lat + dLat * this.gridSize, lng + dLng * this.gridSize);
        const cell = this.grid.get(cellKey);
        
        if (cell) {
          for (const entry of cell) {
            const distance = Math.sqrt(
              Math.pow(entry.lat - lat, 2) + Math.pow(entry.lng - lng, 2)
            );
            
            if (distance <= radiusDeg) {
              results.push(entry);
            }
          }
        }
      }
    }
    
    return results;
  }

  // Find entries within bounds
  findByBounds(north: number, south: number, east: number, west: number): GeoIndexEntry[] {
    const results: GeoIndexEntry[] = [];
    
    for (const entry of this.entries) {
      if (
        entry.lat >= south &&
        entry.lat <= north &&
        entry.lng >= west &&
        entry.lng <= east
      ) {
        results.push(entry);
      }
    }
    
    return results;
  }

  clear(): void {
    this.entries = [];
    this.grid.clear();
  }

  private getCellKey(lat: number, lng: number): string {
    const cellLat = Math.floor(lat / this.gridSize) * this.gridSize;
    const cellLng = Math.floor(lng / this.gridSize) * this.gridSize;
    return `${cellLat.toFixed(4)},${cellLng.toFixed(4)}`;
  }
}

// Data transformation utilities
export function optimizeNodesForRendering(nodes: NetworkNode[]): NetworkNode[] {
  // Pre-compute frequently accessed properties
  return nodes.map(node => ({
    ...node,
    // Add precomputed values for rendering
    metadata: {
      ...node.metadata,
      _renderKey: `${node.type}-${node.status}`,
      _positionKey: `${node.position.lat.toFixed(6)},${node.position.lng.toFixed(6)}`,
    }
  }));
}

export function filterVisibleNodes(
  nodes: NetworkNode[],
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number
): NetworkNode[] {
  // At low zoom levels, reduce node density
  const minDistance = zoom < 10 ? 0.1 : zoom < 15 ? 0.01 : 0.001;
  
  const visible = nodes.filter(node => {
    const { lat, lng } = node.position;
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });

  // Simple clustering for high-density areas at low zoom
  if (zoom < 12 && visible.length > 100) {
    return clusterNodes(visible, minDistance);
  }

  return visible;
}

function clusterNodes(nodes: NetworkNode[], minDistance: number): NetworkNode[] {
  const clusters: NetworkNode[] = [];
  const used = new Set<string>();

  for (const node of nodes) {
    if (used.has(node.id)) continue;

    const nearby = nodes.filter(other => {
      if (used.has(other.id) || other.id === node.id) return false;
      const dist = Math.sqrt(
        Math.pow(other.position.lat - node.position.lat, 2) +
        Math.pow(other.position.lng - node.position.lng, 2)
      );
      return dist < minDistance;
    });

    if (nearby.length > 0) {
      // Create cluster representative
      const clusterNode: NetworkNode = {
        ...node,
        id: `cluster_${node.id}_${nearby.length}`,
        name: `${nearby.length + 1} nodes`,
        metadata: {
          ...node.metadata,
          isCluster: true,
          clusterSize: nearby.length + 1,
          memberIds: [node.id, ...nearby.map(n => n.id)]
        }
      };
      clusters.push(clusterNode);
      used.add(node.id);
      nearby.forEach(n => used.add(n.id));
    } else {
      clusters.push(node);
      used.add(node.id);
    }
  }

  return clusters;
}
