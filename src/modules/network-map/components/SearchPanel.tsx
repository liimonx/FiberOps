"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, Icon, Button } from "@shohojdhara/atomix";
import {
  NetworkNode,
  NetworkConnection,
  AssetCategory,
  CategorizedResult,
} from "../types";
import { useAssetSearch } from "../hooks/useAssetSearch";
import { useResponsive } from "../hooks/useResponsive";
import { isTypingInField } from "../hooks/useMapKeyboardShortcuts";
import { SearchInput } from "./SearchInput";
import { CategoryFilterTabs } from "./CategoryFilterTabs";
import { SearchResultsList } from "./SearchResultsList";
import { QuickActions } from "./QuickActions";

interface SearchPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onSelectResult: (result: CategorizedResult) => void;
  className?: string;
  defaultCollapsed?: boolean;
  disabled?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  connections,
  onSelectResult,
  className = "",
  defaultCollapsed,
  disabled = false,
}) => {
  const { isMobile } = useResponsive();
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(
    defaultCollapsed ?? isMobile
  );

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

  const [isOpen, setIsOpen] = useState(false);

  // Sync collapse to the responsive breakpoint without a setState-in-effect.
  // Adjusting state during render is React's recommended pattern here since the
  // panel can also be collapsed/expanded manually by the user.
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (defaultCollapsed === undefined) {
      setCollapsed(isMobile);
    }
  }

  useEffect(() => {
    const handleSearchFocusShortcut = (e: KeyboardEvent) => {
      if (disabled || e.key !== "/" || e.ctrlKey || e.metaKey) return;
      if (isTypingInField()) return;
      e.preventDefault();
      setCollapsed(false);
      setIsOpen(true);
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", handleSearchFocusShortcut);
    return () => window.removeEventListener("keydown", handleSearchFocusShortcut);
  }, [disabled]);

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
        setIsOpen(false);
        inputRef.current?.blur();
        if (isMobile) setCollapsed(true);
        break;
    }
  };

  const handleSelectResult = (result: CategorizedResult) => {
    onSelectResult(result);
    clearSearch();
    setIsOpen(false);
    if (isMobile) setCollapsed(true);
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
      onClick: () => {
        setSelectedCategory("nodes");
        setQuery("pop");
      },
    },
    {
      label: "Find Connections",
      icon: "GitBranch",
      onClick: () => {
        setSelectedCategory("connections");
        setQuery("fiber");
      },
    },
  ];

  if (collapsed) {
    return (
      <Button
        variant="secondary"
        size="sm"
        iconName="MagnifyingGlass"
        onClick={() => {
          setCollapsed(false);
          setIsOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        disabled={disabled}
        aria-label="Open map search"
        className={className}
      >
        Search
      </Button>
    );
  }

  return (
    <Card className={className}>
      <div className="u-flex u-items-center u-gap-2 u-w-100">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onClear={() => {
              clearSearch();
              setIsOpen(false);
            }}
            ariaControls="search-results"
            ariaActiveDescendant={
              highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
            }
          />
        {isMobile && (
          <Button
            variant="secondary"
            size="sm"
            iconName="X"
            iconOnly
            onClick={() => {
              clearSearch();
              setCollapsed(true);
            }}
            aria-label="Collapse search"
          />
        )}
      </div>

      {query && (
        <>
          <CategoryFilterTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryCounts={categoryCounts}
          />

          <SearchResultsList
            results={results}
            highlightedIndex={highlightedIndex}
            onSelect={handleSelectResult}
            onHighlight={setHighlightedIndex}
          />
        </>
      )}

      {!query && isOpen && <QuickActions actions={quickActions} />}

      {query && results.length === 0 && (
        <div className="u-py-10 u-px-4 u-text-center">
          <Icon
            name="MagnifyingGlass"
            size={32}
            className="u-text-secondary-emphasis u-opacity-30 u-mb-4"
          />
          <p className="u-m-0 u-mb-2 u-text-sm u-font-bold">
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
