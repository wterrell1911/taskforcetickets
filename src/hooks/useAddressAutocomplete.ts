/**
 * Hook for address autocomplete using Smarty API
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AddressSuggestion } from '@/lib/validation';

interface UseAddressAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  states?: string[];
}

interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
  selectSuggestion: (suggestion: AddressSuggestion) => {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn {
  const { debounceMs = 300, minChars = 3, states = ['TN', 'AR', 'MS'] } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const search = useCallback(
    (query: string) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Check minimum characters
      if (!query || query.length < minChars) {
        setSuggestions([]);
        setError(null);
        return;
      }

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);

        try {
          // Create new abort controller
          abortControllerRef.current = new AbortController();

          const params = new URLSearchParams({
            q: query,
            states: states.join(','),
          });

          const response = await fetch(`/api/validation/address/autocomplete?${params}`, {
            signal: abortControllerRef.current.signal,
          });

          const data = await response.json();

          if (data.success) {
            setSuggestions(data.suggestions || []);
          } else {
            setError(data.error || 'Autocomplete failed');
            setSuggestions([]);
          }
        } catch (err) {
          // Ignore abort errors
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          console.error('Address autocomplete error:', err);
          setError('Address lookup unavailable');
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, minChars, states]
  );

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    const street = suggestion.secondary
      ? `${suggestion.streetLine} ${suggestion.secondary}`
      : suggestion.streetLine;

    return {
      street,
      city: suggestion.city,
      state: suggestion.state,
      zipCode: suggestion.zipCode,
      fullAddress: `${street}, ${suggestion.city}, ${suggestion.state} ${suggestion.zipCode}`,
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clear,
    selectSuggestion,
  };
}
