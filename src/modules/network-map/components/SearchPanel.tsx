"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon, Input, Card, Button } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection, SearchResult, NetworkNodeType } from '../types';
import { StatusIndicator } from './StatusIndicator';
import { NODE_TYPE_ICONS } from '../constants';

interface SearchPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onSelectResult: (result: SearchResult) => void;
  onClose?: () => void;
  className?: string;
  isOpen?: boolean;
}

type AssetCategory = 'all' | 'nodes' | 'connections' | 'customers';

interface CategorizedResult extends SearchResult {
  category: AssetCategory;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  nodes,
  connections,
  onSelectResult,
  onClose,
  className = '',
  isOpen = true
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [results, setResults] = useState<CategorizedResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search functionality
  const performSearch = useCallback((searchQuery: string, category: AssetCategory) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    const searchResults: CategorizedResult[] = [];

    // Search nodes
    if (category === 'all' || category === 'nodes') {
      nodes.forEach(node => {
        const matchScore = calculateMatchScore(node.name, normalizedQuery);
        if (matchScore > 0) {
          searchResults.push({
            id: node.id,
            name: node.name,
            type: 'node',
            matchScore,
            category: node.type === NetworkNodeType.CUSTOMER ? 'customers' : 'nodes'
          });
        }
      });
    }

    // Search connections
    if (category === 'all' || category === 'connections') {
      connections.forEach(conn => {
        const matchScore = calculateMatchScore(conn.id, normalizedQuery);
        if (matchScore > 0) {
          searchResults.push({
            id: conn.id,
            name: `Connection ${conn.id}`,
            type: 'connection',
            matchScore,
            category: 'connections'
          });
        }
      });
    }

    // Sort by match score
    searchResults.sort((a, b) => b.matchScore - a.matchScore);
    setResults(searchResults.slice(0, 10)); // Limit to top 10
  }, [nodes, connections]);

  const calculateMatchScore = (text: string, query: string): number => {
    const normalizedText = text.toLowerCase();
    
    // Exact match
    if (normalizedText === query) return 1;
    
    // Starts with query
    if (normalizedText.startsWith(query)) return 0.8;
    
    // Contains query
    if (normalizedText.includes(query)) return 0.6;
    
    // Fuzzy match
    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < query.length; i++) {
      if (normalizedText[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    if (queryIndex === query.length) return 0.4;
    
    return 0;
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, selectedCategory);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectResult(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setQuery('');
        setResults([]);
        onClose?.();
        break;
    }
  };

  const handleSelectResult = (result: CategorizedResult) => {
    onSelectResult(result);
    setQuery('');
    setResults([]);
    setHighlightedIndex(-1);
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'nodes': return 'HardDrives';
      case 'connections': return 'GitBranch';
      case 'customers': return 'Users';
      default: return 'SquaresFour';
    }
  };

  const getCategoryCount = (category: AssetCategory) => {
    if (category === 'all') return results.length;
    return results.filter(r => r.category === category).length;
  };

  const categories: AssetCategory[] = ['all', 'nodes', 'connections', 'customers'];

  if (!isOpen) return null;

  return (
    <Card appearance="elevated" glass={true} className={`search-panel ${className}`}>
      <div className="search-header">
        <div className="search-input-wrapper">
          <Icon name="MagnifyingGlass" size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search assets, routes, or customers..."
            className="search-input"
            aria-label="Search network assets"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined}
          />
          {query && (
            <Button
              variant="secondary"
              size="sm"
              iconName="X"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="clear-button"
              aria-label="Clear search"
            />
          )}
        </div>

        {/* Category filters */}
        <div className="category-filters" role="tablist" aria-label="Search categories">
          {categories.map(category => (
            <button
              key={category}
              role="tab"
              aria-selected={selectedCategory === category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category);
                performSearch(query, category);
              }}
            >
              <Icon name={getCategoryIcon(category) as any} size={14} />
              <span className="category-label">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              <span className="category-count">{getCategoryCount(category)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div 
          id="search-results" 
          className="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`search-result ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="result-icon">
                <Icon 
                  name={result.type === 'node' ? (NODE_TYPE_ICONS[NetworkNodeType.DISTRIBUTION_NODE] as any) : 'GitBranch'} 
                  size={16} 
                />
              </div>
              <div className="result-content">
                <span className="result-name">{result.name}</span>
                <span className="result-type">{result.type}</span>
              </div>
              <Icon name="ArrowRight" size={14} className="result-arrow" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="search-empty">
          <Icon name="MagnifyingGlass" size={24} className="empty-icon" />
          <p>No results found for "{query}"</p>
          <span className="empty-hint">Try a different search term</span>
        </div>
      )}

      {/* Quick actions */}
      {!query && (
        <div className="quick-actions">
          <span className="quick-actions-label">Quick Actions</span>
          <div className="quick-actions-grid">
            <button className="quick-action" onClick={() => setQuery('node')}>
              <Icon name="HardDrives" size={16} />
              <span>Find Nodes</span>
            </button>
            <button className="quick-action" onClick={() => setQuery('route')}>
              <Icon name="GitBranch" size={16} />
              <span>Trace Routes</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-panel {
          width: 360px;
          max-width: 100%;
          padding: 0;
          overflow: hidden;
        }

        .search-header {
          padding: 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--color-gray-500);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 36px;
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-700);
          border-radius: 8px;
          color: var(--color-gray-100);
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .search-input::placeholder {
          color: var(--color-gray-500);
        }

        .clear-button {
          position: absolute;
          right: 4px;
          padding: 4px;
          min-width: auto;
        }

        .category-filters {
          display: flex;
          gap: 4px;
          margin-top: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--color-gray-400);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .category-tab:hover {
          background: var(--color-gray-800);
          color: var(--color-gray-200);
        }

        .category-tab.active {
          background: var(--color-primary-500);
          border-color: var(--color-primary-500);
          color: white;
        }

        .category-label {
          text-transform: capitalize;
        }

        .category-count {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          font-size: 10px;
          font-weight: var(--font-weight-semibold);
        }

        .search-results {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .search-result:hover,
        .search-result.highlighted {
          background: var(--color-gray-800);
        }

        .result-icon {
          color: var(--color-primary-500);
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .result-name {
          color: var(--color-gray-200);
          font-size: 14px;
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-type {
          color: var(--color-gray-500);
          font-size: 11px;
          text-transform: capitalize;
        }

        .result-arrow {
          color: var(--color-gray-500);
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .search-result:hover .result-arrow,
        .search-result.highlighted .result-arrow {
          opacity: 1;
          color: var(--color-primary-500);
        }

        .search-empty {
          padding: 32px 16px;
          text-align: center;
          color: var(--color-gray-400);
        }

        .empty-icon {
          color: var(--color-gray-600);
          margin-bottom: 12px;
        }

        .search-empty p {
          margin: 0 0 4px;
          font-size: 14px;
          color: var(--color-gray-300);
        }

        .empty-hint {
          font-size: 12px;
          color: var(--color-gray-500);
        }

        .quick-actions {
          padding: 16px;
          border-top: 1px solid var(--color-gray-700);
        }

        .quick-actions-label {
          display: block;
          font-size: 11px;
          color: var(--color-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-700);
          border-radius: 6px;
          color: var(--color-gray-300);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action:hover {
          background: var(--color-gray-700);
          border-color: var(--color-primary-500);
          color: var(--color-gray-100);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .search-panel {
            width: 100%;
            max-width: none;
          }

          .category-filters {
            gap: 2px;
          }

          .category-tab {
            padding: 4px 8px;
            font-size: 11px;
          }

          .search-results {
            max-height: 200px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .search-input,
          .category-tab,
          .search-result,
          .result-arrow,
          .quick-action {
            transition: none;
          }
        }
      `}</style>
    </Card>
  );
};
