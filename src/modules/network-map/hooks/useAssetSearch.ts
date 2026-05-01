"use client";

import { useState, useEffect, useCallback } from 'react';
import { NetworkNode, NetworkConnection, SearchResult, NetworkNodeType } from '../types';

export type AssetCategory = 'all' | 'nodes' | 'connections' | 'customers';

/**
 * Extended search result with category information for filtering
 * Inherits all properties from SearchResult plus category field
 */
export interface CategorizedResult extends SearchResult {
  category: AssetCategory;
}

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
 * Custom hook for searching network assets (nodes, connections, customers)
 * Implements debounced search with fuzzy matching and category filtering
 */
export const useAssetSearch = ({
  nodes,
  connections,
  debounceMs = 150,
  maxResults = 10
}: UseAssetSearchProps): UseAssetSearchReturn => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [results, setResults] = useState<CategorizedResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  /**
   * Calculate match score between text and search query
   * Returns a score from 0 (no match) to 1 (exact match)
   */
  const calculateMatchScore = useCallback((text: string, query: string): number => {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // Exact match
    if (normalizedText === normalizedQuery) return 1;
    
    // Starts with query
    if (normalizedText.startsWith(normalizedQuery)) return 0.8;
    
    // Contains query
    if (normalizedText.includes(normalizedQuery)) return 0.6;
    
    // Fuzzy match - check if all query characters appear in order
    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        queryIndex++;
      }
    }
    if (queryIndex === normalizedQuery.length) return 0.4;
    
    return 0;
  }, []);

  /**
   * Perform search across nodes and connections based on query and category
   */
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

    // Sort by match score and limit results
    searchResults.sort((a, b) => b.matchScore - a.matchScore);
    setResults(searchResults.slice(0, maxResults));
  }, [nodes, connections, calculateMatchScore, maxResults]);

  /**
   * Handle result selection - clears search state
   */
  const handleSelectResult = useCallback((result: CategorizedResult) => {
    setQuery('');
    setResults([]);
    setHighlightedIndex(-1);
  }, []);

  /**
   * Clear all search state
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setHighlightedIndex(-1);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, selectedCategory);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, selectedCategory, performSearch, debounceMs]);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    highlightedIndex,
    setHighlightedIndex,
    handleSelectResult,
    clearSearch
  };
};
