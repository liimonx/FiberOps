"use client";

import React from "react";
import { Card, Icon } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection } from "../types";
import {
  useAssetSearch,
  AssetCategory,
  CategorizedResult,
} from "../hooks/useAssetSearch";
import { SearchInput } from "./SearchInput";
import { CategoryFilterTabs } from "./CategoryFilterTabs";
import { SearchResultsList } from "./SearchResultsList";
import { QuickActions } from "./QuickActions";
interface SearchPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onSelectResult: (result: CategorizedResult) => void;
  className?: string;
  isOpen?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  connections,
  onSelectResult,
  className = "",
  isOpen = true,
}) => {
  const {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    highlightedIndex,
    setHighlightedIndex,
    clearSearch,
  } = useAssetSearch({ nodes, connections });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(
          highlightedIndex < results.length - 1 ? highlightedIndex + 1 : highlightedIndex
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(highlightedIndex > 0 ? highlightedIndex - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          onSelectResult(results[highlightedIndex]);
          clearSearch();
        }
        break;
      case "Escape":
        clearSearch();
        break;
    }
  };

  const handleSelectResult = (result: CategorizedResult) => {
    onSelectResult(result);
    clearSearch();
  };

  const getCategoryCount = (category: AssetCategory) => {
    if (category === "all") return results.length;
    return results.filter((r) => r.category === category).length;
  };

  const categoryCounts: Record<AssetCategory, number> = {
    all: results.length,
    nodes: getCategoryCount("nodes"),
    connections: getCategoryCount("connections"),
    customers: getCategoryCount("customers"),
  };

  const quickActions = [
    {
      label: "Find Nodes",
      icon: "HardDrives",
      onClick: () => setQuery("node"),
    },
    {
      label: "Trace Routes",
      icon: "GitBranch",
      onClick: () => setQuery("route"),
    },
  ];

  if (!isOpen) return null;

  return (
    <Card
      glass={{ elasticity: 10, blurAmount: 3, displacementScale: 100 }}
      className={`u-w-100 u-p-0 u-overflow-hidden ${className}`}
    >
      <div>
        <SearchInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          onClear={clearSearch}
          ariaControls="search-results"
          ariaActiveDescendant={
            highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
          }
        />

        <CategoryFilterTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Search results */}
      <SearchResultsList
        results={results}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectResult}
        onHighlight={setHighlightedIndex}
      />

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="u-py-8 u-px-4 u-text-center u-text-muted">
          <Icon name="MagnifyingGlass" size={24} className="u-text-disabled u-mb-3" />
          <p className="u-m-0 u-mb-1 u-text-sm u-text-secondary">
            No results found for <strong>{query}</strong>
          </p>
          <span className="u-text-xs u-text-muted">Try a different search term</span>
        </div>
      )}

      {/* Quick actions */}
      {!query && <QuickActions actions={quickActions} />}
    </Card>
  );
};
