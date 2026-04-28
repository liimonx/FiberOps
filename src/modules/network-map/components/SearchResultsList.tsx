"use client";

import React from 'react';
import { Icon } from "@shohojdhara/atomix";
import { CategorizedResult } from '../hooks/useAssetSearch';
import { NODE_TYPE_ICONS } from '../constants';
import { NetworkNodeType } from '../types';

interface SearchResultsListProps {
  results: CategorizedResult[];
  highlightedIndex: number;
  onSelect: (result: CategorizedResult) => void;
  onHighlight: (index: number) => void;
  containerClassName?: string;
  itemClassName?: string;
}

/**
 * Accessible search results list with keyboard navigation support
 */
export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  highlightedIndex,
  onSelect,
  onHighlight,
  containerClassName = '',
  itemClassName = ''
}) => {
  if (results.length === 0) return null;

  return (
    <div 
      id="search-results" 
      className={`search-results ${containerClassName}`}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result, index) => (
        <div
          key={result.id}
          id={`search-result-${index}`}
          role="option"
          aria-selected={index === highlightedIndex}
          className={`search-result ${index === highlightedIndex ? 'highlighted' : ''} ${itemClassName}`}
          onClick={() => onSelect(result)}
          onMouseEnter={() => onHighlight(index)}
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
  );
};
