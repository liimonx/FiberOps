"use client";

import React from "react";
import { Icon } from "@shohojdhara/atomix";
import { CategorizedResult } from "../types";
import { NODE_TYPE_ICONS } from "../constants";
import { NetworkNodeType } from "../types";

interface SearchResultsListProps {
  results: CategorizedResult[];
  highlightedIndex: number;
  onSelect: (result: CategorizedResult) => void;
  onHighlight: (index: number) => void;
  className?: string;
}

/**
 * Accessible search results list with keyboard navigation support
 */
export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  highlightedIndex,
  onSelect,
  onHighlight,
  className = "",
}) => {
  if (results.length === 0) return null;

  return (
    <div
      id="search-results"
      className={`u-overflow-y-auto u-p-2 u-flex u-flex-column u-gap-1 ${className}`}
      style={{ maxHeight: "300px" }}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result, index) => {
        const isHighlighted = index === highlightedIndex;

        return (
          <div
            key={result.id}
            id={`search-result-${index}`}
            role="option"
            aria-selected={isHighlighted}
            className={`u-flex u-items-center u-gap-3 u-py-3 u-px-4 u-rounded u-cursor-pointer u-transition-all ${
              isHighlighted ? "u-bg-primary-subtle u-shadow-sm" : "u-bg-transparent"
            }`}
            onClick={() => onSelect(result)}
            onMouseEnter={() => onHighlight(index)}
          >
            <div
              className={`u-flex-shrink-0 u-flex u-items-center u-justify-center u-rounded u-bg-dark ${isHighlighted ? "" : "u-text-secondary-emphasis"}`}
              style={{ width: "2rem", height: "2rem" }}
            >
              <Icon
                name={
                  result.type === "node"
                    ? NODE_TYPE_ICONS[NetworkNodeType.DISTRIBUTION_NODE]
                    : "GitBranch"
                }
                size={18}
              />
            </div>
            <div className="u-flex-1 u-flex u-flex-column u-min-w-0">
              <span
                className={`u-text-sm u-font-bold u-text-truncate ${isHighlighted ? "" : "u-text-secondary-emphasis"}`}
              >
                {result.name}
              </span>
              <span
                className={`u-text-xs u-opacity-70 ${isHighlighted ? "" : "u-text-secondary-emphasis"}`}
              >
                {result.type}
              </span>
            </div>
            <Icon
              name="ArrowRight"
              size={16}
              className={`u-flex-shrink-0 u-transition-all ${isHighlighted ? "u-opacity-100" : "u-opacity-0"}`}
            />
          </div>
        );
      })}
    </div>
  );
};
