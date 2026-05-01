"use client";

import React from "react";
import { Icon, Button, Badge } from "@shohojdhara/atomix";
import { AssetCategory } from "../hooks/useAssetSearch";

interface CategoryFilterTabsProps {
  selectedCategory: AssetCategory;
  onCategoryChange: (category: AssetCategory) => void;
  categoryCounts: Record<AssetCategory, number>;
  className?: string;
}

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: string }> = {
  all: { label: "All", icon: "SquaresFour" },
  nodes: { label: "Nodes", icon: "HardDrives" },
  connections: { label: "Connections", icon: "GitBranch" },
  customers: { label: "Customers", icon: "Users" },
};

/**
 * Tab-based category filter for search results
 */
export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  className = "",
}) => {
  const categories: AssetCategory[] = ["all", "nodes", "connections", "customers"];

  return (
    <div
      className={`u-flex u-gap-2 u-px-4 u-py-3 u-overflow-x-auto u-no-scrollbar ${className}`}
      role="tablist"
      aria-label="Search categories"
    >
      {categories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const isActive = selectedCategory === category;
        const count = categoryCounts[category];

        return (
          <Button
            key={category}
            aria-selected={isActive}
            aria-controls="search-results"
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            iconName={config.icon}
            onClick={() => onCategoryChange(category)}
            className="u-flex-shrink-0 u-transition-all"
            style={{
              transform: isActive ? "translateY(-2px)" : "none",
            }}
          >
            <span className="u-text-capitalize">{config.label}</span>
            <Badge label={`${count}`} variant={isActive ? "primary" : "secondary"} size="sm" className="u-ms-2" />
          </Button>
        );
      })}
    </div>
  );
};
