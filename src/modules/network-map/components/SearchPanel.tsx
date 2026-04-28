"use client";

import React from 'react';
import { Card, Icon } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection, SearchResult } from '../types';
import { useAssetSearch, AssetCategory, CategorizedResult } from '../hooks/useAssetSearch';
import { SearchInput } from './SearchInput';
import { CategoryFilterTabs } from './CategoryFilterTabs';
import { SearchResultsList } from './SearchResultsList';
import { QuickActions } from './QuickActions';
import styles from './SearchPanel.module.scss';

interface SearchPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onSelectResult: (result: SearchResult) => void;
  onClose?: () => void;
  className?: string;
  isOpen?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  connections,
  onSelectResult,
  onClose,
  className = '',
  isOpen = true
}) => {
  const {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    highlightedIndex,
    setHighlightedIndex,
    clearSearch
  } = useAssetSearch({ nodes, connections });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(
          highlightedIndex < results.length - 1 ? highlightedIndex + 1 : highlightedIndex
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(highlightedIndex > 0 ? highlightedIndex - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          onSelectResult(results[highlightedIndex]);
          clearSearch();
        }
        break;
      case 'Escape':
        clearSearch();
        onClose?.();
        break;
    }
  };

  const handleSelectResult = (result: CategorizedResult) => {
    onSelectResult(result);
    clearSearch();
  };

  const getCategoryCount = (category: AssetCategory) => {
    if (category === 'all') return results.length;
    return results.filter(r => r.category === category).length;
  };

  const categoryCounts: Record<AssetCategory, number> = {
    all: results.length,
    nodes: getCategoryCount('nodes'),
    connections: getCategoryCount('connections'),
    customers: getCategoryCount('customers')
  };

  const quickActions = [
    {
      label: 'Find Nodes',
      icon: 'HardDrives',
      onClick: () => setQuery('node')
    },
    {
      label: 'Trace Routes',
      icon: 'GitBranch',
      onClick: () => setQuery('route')
    }
  ];

  if (!isOpen) return null;

  return (
    <Card glass={{elasticity: 10, blurAmount: 3, displacementScale: 100}} className={`${styles.searchPanel} ${className}`}>
      <div className={styles.searchHeader}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          onClear={clearSearch}
          ariaControls="search-results"
          ariaActiveDescendant={highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined}
          wrapperClassName={styles.searchInputWrapper}
          inputClassName={styles.searchInput}
          iconClassName={styles.searchIcon}
          buttonClassName={styles.clearButton}
        />

        <CategoryFilterTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
          containerClassName={styles.categoryFilters}
          tabClassName={styles.categoryTab}
        />
      </div>

      {/* Search results */}
      <SearchResultsList
        results={results}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectResult}
        onHighlight={setHighlightedIndex}
        containerClassName={styles.searchResults}
        itemClassName={styles.searchResult}
      />

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className={styles.searchEmpty}>
          <Icon name="MagnifyingGlass" size={24} className={styles.emptyIcon} />
          <p>No results found for "{query}"</p>
          <span className={styles.emptyHint}>Try a different search term</span>
        </div>
      )}

      {/* Quick actions */}
      {!query && (
        <QuickActions 
          actions={quickActions}
          containerClassName={styles.quickActions}
          labelClassName={styles.quickActionsLabel}
          gridClassName={styles.quickActionsGrid}
          actionClassName={styles.quickAction}
        />
      )}
    </Card>
  );
};
