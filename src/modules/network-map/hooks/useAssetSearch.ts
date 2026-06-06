"use client";

import { useState, useEffect, useCallback } from "react";
import { NetworkNode, NetworkConnection, AssetCategory, CategorizedResult } from "../types";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { searchNetworkAssets } from "../utils/assetSearch";

interface UseAssetSearchProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  debounceMs?: number;
  maxResults?: number;
}

interface UseAssetSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  selectedCategory: AssetCategory;
  setSelectedCategory: (category: AssetCategory) => void;
  results: CategorizedResult[];
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  handleSelectResult: (result: CategorizedResult) => void;
  clearSearch: () => void;
}

/**
 * Debounced network asset search synced with the global map store
 * (searchQuery is persisted across sessions).
 */
export const useAssetSearch = ({
  nodes,
  connections,
  debounceMs = 150,
  maxResults = 10,
}: UseAssetSearchProps): UseAssetSearchReturn => {
  const query = useNetworkMapStore((state) => state.searchQuery);
  const results = useNetworkMapStore((state) => state.searchResults);
  const setSearchQuery = useNetworkMapStore((state) => state.setSearchQuery);
  const setSearchResults = useNetworkMapStore((state) => state.setSearchResults);

  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>("all");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const setQuery = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (!value.trim()) {
        setSearchResults([]);
        setHighlightedIndex(-1);
      }
    },
    [setSearchQuery, setSearchResults]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedIndex(-1);
  }, [setSearchQuery, setSearchResults]);

  const handleSelectResult = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchNetworkAssets(
        nodes,
        connections,
        query,
        selectedCategory,
        maxResults
      );
      setSearchResults(next);
      setHighlightedIndex(next.length > 0 ? 0 : -1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    query,
    selectedCategory,
    nodes,
    connections,
    debounceMs,
    maxResults,
    setSearchResults,
  ]);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    highlightedIndex,
    setHighlightedIndex,
    handleSelectResult,
    clearSearch,
  };
};
