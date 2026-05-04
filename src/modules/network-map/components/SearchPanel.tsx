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
    <Card glass={{ blurAmount: 5 }} appearance="ghost" className={` ${className}`}>
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

      {/* Search results */}
      <SearchResultsList
        results={results}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectResult}
        onHighlight={setHighlightedIndex}
      />

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="u-py-10 u-px-4 u-text-center">
          <Icon
            name="MagnifyingGlass"
            size={32}
            className="u-text-secondary-emphasis u-opacity-30 u-mb-4"
          />
          <p className="u-m-0 u-mb-2 u-text-sm u-font-bold ">
            No results found for "{query}"
          </p>
          <span className="u-text-xs u-text-secondary-emphasis">
            Try adjusting your keywords or categories
          </span>
        </div>
      )}

      {/* Quick actions */}
      {!query && <QuickActions actions={quickActions} />}
    </Card>
  );
};
