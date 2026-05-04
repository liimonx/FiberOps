"use client";

import React, { useRef } from "react";
import { Icon, Button, Input } from "@shohojdhara/atomix";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
  ariaControls?: string;
  ariaActiveDescendant?: string;
  className?: string;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Search input component with clear button and accessibility support
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onClear,
  placeholder = "Search assets, routes, or customers...",
  ariaControls,
  ariaActiveDescendant,
  className = "",
  onFocus,
  onBlur,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`u-relative u-flex u-items-center u-w-100  u-transition-all ${className}`}
      onKeyDown={onKeyDown}
    >
      <div className="u-absolute u-ms-4 u-flex u-items-center u-opacity-50">
        <Icon name="MagnifyingGlass" size={18} className="u-text-secondary-emphasis" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="u-w-100 u-ps-10"
        aria-label="Search network assets"
        aria-controls={ariaControls}
        aria-activedescendant={ariaActiveDescendant}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value && (
        <div className="u-absolute u-end-0 u-me-2 u-flex u-items-center">
          <Button
            variant="secondary"
            size="sm"
            iconName="X"
            iconOnly
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          />
        </div>
      )}
    </div>
  );
};
