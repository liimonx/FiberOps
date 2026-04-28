"use client";

import React, { useRef } from 'react';
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
  wrapperClassName = '',
  inputClassName = '',
  iconClassName = '',
  buttonClassName = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`search-input-wrapper ${wrapperClassName}`}>
      <Icon name="MagnifyingGlass" size={16} className={`search-icon ${iconClassName}`} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`search-input ${inputClassName}`}
        aria-label="Search network assets"
        aria-autocomplete="list"
        aria-controls={ariaControls}
        aria-activedescendant={ariaActiveDescendant}
      />
      {value && (
        <Button
          variant="secondary"
          size="sm"
          iconName="X"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          className={`clear-button ${buttonClassName}`}
          aria-label="Clear search"
        />
      )}
    </div>
  );
};
