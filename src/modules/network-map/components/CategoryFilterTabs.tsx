"use client";

import React from 'react';
import { Icon, Button } from "@shohojdhara/atomix";
import { AssetCategory } from '../hooks/useAssetSearch';

interface CategoryFilterTabsProps {
  selectedCategory: AssetCategory;
  onCategoryChange: (category: AssetCategory) => void;
  categoryCounts: Record<AssetCategory, number>;
  containerClassName?: string;
  tabClassName?: string;
}

const CATEGORY_CONFIG: Record<AssetCategory, { label: string; icon: string }> = {
  all: { label: 'All', icon: 'SquaresFour' },
  nodes: { label: 'Nodes', icon: 'HardDrives' },
  connections: { label: 'Connections', icon: 'GitBranch' },
  customers: { label: 'Customers', icon: 'Users' }
};

/**
 * Tab-based category filter for search results
 */
export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  containerClassName = '',
  tabClassName = ''
}) => {
  const categories: AssetCategory[] = ['all', 'nodes', 'connections', 'customers'];

  return (
    <div 
      className={`category-filters ${containerClassName}`} 
      role="tablist" 
      aria-label="Search categories"
    >
      {categories.map(category => {
        const config = CATEGORY_CONFIG[category];
        const isActive = selectedCategory === category;
        const count = categoryCounts[category];

        return (
          <Button
            key={category}
            role="tab"
            aria-selected={isActive}
            aria-controls="search-results"
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            iconName={config.icon as any}
            onClick={() => onCategoryChange(category)}
            className={`category-tab ${isActive ? 'active' : ''} ${tabClassName}`}
          >
            <span className="category-label">{config.label}</span>
            <span className="category-count">{count}</span>
          </Button>
        );
      })}
    </div>
  );
};
