'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete';
import type { AddressSuggestion } from '@/lib/validation';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  }) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  states?: string[];
}

export function AddressAutocomplete({
  value,
  onChange,
  onInputChange,
  placeholder = 'Start typing your address...',
  error,
  label = 'Address',
  required = false,
  className = '',
  states = ['TN', 'AR', 'MS'],
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, search, clear, selectSuggestion } = useAddressAutocomplete({
    states,
    debounceMs: 250,
  });

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onInputChange?.(newValue);
      search(newValue);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    },
    [onInputChange, search]
  );

  // Handle suggestion selection
  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      const selected = selectSuggestion(suggestion);
      setInputValue(selected.fullAddress);
      onChange(selected);
      setShowDropdown(false);
      clear();
    },
    [selectSuggestion, onChange, clear]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelect(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [showDropdown, suggestions, highlightedIndex, handleSelect]
  );

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor="address-input"
          className="block text-sm font-semibold text-[#1A1A1A] mb-2"
        >
          {label} {required && <span className="text-[#CF2A27]">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="address-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-4 rounded-xl border ${
            error ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
          } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />

        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-[#4A4A4A]"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-[#E5E5E5] shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => {
            const displayText = suggestion.secondary
              ? `${suggestion.streetLine} ${suggestion.secondary}`
              : suggestion.streetLine;

            return (
              <button
                key={`${suggestion.streetLine}-${suggestion.zipCode}-${index}`}
                type="button"
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-[#F8F8F8] transition-colors ${
                  highlightedIndex === index ? 'bg-[#F8F8F8]' : ''
                } ${index === 0 ? 'rounded-t-xl' : ''} ${
                  index === suggestions.length - 1 ? 'rounded-b-xl' : ''
                }`}
                role="option"
                aria-selected={highlightedIndex === index}
              >
                <div className="font-medium text-[#1A1A1A]">{displayText}</div>
                <div className="text-sm text-[#4A4A4A]">
                  {suggestion.city}, {suggestion.state} {suggestion.zipCode}
                </div>
                {suggestion.entries && suggestion.entries > 1 && (
                  <div className="text-xs text-[#FFD100] mt-1">
                    {suggestion.entries} units at this address
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-[#CF2A27]">{error}</p>}
    </div>
  );
}
