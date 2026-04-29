"use client";

import React from "react";
import { Icon } from "@shohojdhara/atomix";
import { CategorizedResult } from "../hooks/useAssetSearch";
import { NODE_TYPE_ICONS } from "../constants";
import { NetworkNodeType } from "../types";

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
  containerClassName = "",
  itemClassName = "",
}) => {
  if (results.length === 0) return null;

  return (
    <div
      id="search-results"
      className={`u-overflow-y-auto u-p-2 ${containerClassName}`}
      style={{ maxHeight: "300px" }}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result, index) => (
        <div
          key={result.id}
          id={`search-result-${index}`}
          role="option"
          aria-selected={index === highlightedIndex}
          className={`u-flex u-items-center u-gap-3 u-py-2 u-px-3 u-rounded-sm u-cursor-pointer ${index === highlightedIndex ? "u-bg-hover" : "hover:u-bg-hover"} ${itemClassName}`}
          onClick={() => onSelect(result)}
          onMouseEnter={() => onHighlight(index)}
        >
          <div className="u-text-primary u-flex-shrink-0">
            <Icon
              name={
                result.type === "node"
                  ? NODE_TYPE_ICONS[NetworkNodeType.DISTRIBUTION_NODE]
                  : "GitBranch"
              }
              size={16}
            />
          </div>
          <div className="u-flex-1 u-flex u-flex-column u-min-w-0">
            <span className="u-text-secondary u-fs-sm u-font-medium u-white-space-nowrap u-overflow-hidden u-text-ellipsis">
              {result.name}
            </span>
            <span className="u-text-muted u-fs-xs u-text-capitalize">{result.type}</span>
          </div>
          <Icon
            name="ArrowRight"
            size={14}
            className={`u-flex-shrink-0 u-transition-opacity ${index === highlightedIndex ? "u-opacity-100 u-text-primary" : "u-opacity-0 group-hover:u-opacity-100 u-text-muted"}`}
          />
        </div>
      ))}
    </div>
  );
};
