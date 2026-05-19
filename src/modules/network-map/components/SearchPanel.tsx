"use client";

import React, { useState } from "react";
import { Card, Icon } from "@shohojdhara/atomix";
import {
  NetworkNode,
  NetworkConnection,
  AssetCategory,
  CategorizedResult,
} from "../types";
import { useAssetSearch } from "../hooks/useAssetSearch";
import { SearchInput } from "./SearchInput";
import { CategoryFilterTabs } from "./CategoryFilterTabs";
import { SearchResultsList } from "./SearchResultsList";
import { QuickActions } from "./QuickActions";
interface SearchPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onSelectResult: (result: CategorizedResult) => void;
  className?: string;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  connections,
  onSelectResult,
  className = "",
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
      label: "Find Connections",
      icon: "GitBranch",
      onClick: () => setQuery("pon"),
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={`${className}`}>
      <SearchInput
        value={query}
        onChange={setQuery}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 500)}
        onClear={() => {
          clearSearch();
          setIsOpen(false);
        }}
        ariaControls="search-results"
        ariaActiveDescendant={
          highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
        }
      />

      {query && (
        <>
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
        </>
      )}

      {!query && isOpen && <QuickActions actions={quickActions} />}

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="u-py-10 u-px-4 u-text-center">
          <Icon
            name="MagnifyingGlass"
            size={32}
            className="u-text-secondary-emphasis u-opacity-30 u-mb-4"
          />
          <p className="u-m-0 u-mb-2 u-text-sm u-font-bold ">
            No results found for &ldquo;{query}&rdquo;
          </p>
          <span className="u-text-xs u-text-secondary-emphasis">
            Try adjusting your keywords or categories
          </span>
        </div>
      )}
    </Card>
  );
};
