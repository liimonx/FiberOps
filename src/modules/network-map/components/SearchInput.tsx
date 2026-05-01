"use client";

import React, { useRef } from "react";
import { Icon, Button } from "@shohojdhara/atomix";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
  ariaControls?: string;
  ariaActiveDescendant?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  buttonClassName?: string;
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
  wrapperClassName = "",
  inputClassName = "",
  iconClassName = "",
  buttonClassName = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`u-relative u-flex u-items-center u-w-100 ${wrapperClassName}`}
    >
      <Icon
        name="MagnifyingGlass"
        size={16}
        className={`u-absolute u-ms-3 u-text-muted ${iconClassName}`}
        style={{ pointerEvents: "none" }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`u-w-100 u-ps-5 u-pe-5 ${inputClassName}`}
        aria-label="Search network assets"
        aria-controls={ariaControls}
        aria-activedescendant={ariaActiveDescendant}
      />
      {value && (
        <div className="u-absolute u-end-0 u-me-1 u-flex u-items-center">
          <Button
            variant="secondary"
            size="sm"
            iconName="X"
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className={buttonClassName}
            aria-label="Clear search"
          />
        </div>
      )}
    </div>
  );
};
