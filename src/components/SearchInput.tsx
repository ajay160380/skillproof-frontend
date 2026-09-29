import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
  debounceMs?: number;
  className?: string;
}

/**
 * Debounced search input with clear button and loading indicator.
 * Automatically debounces the onChange callback.
 */
export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  isLoading = false,
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative group ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-brand-primary transition-colors" />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch(value);
          }
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all"
      />
      
      {/* Loading spinner or clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-brand-primary rounded-full animate-spin" />
        ) : value ? (
          <button
            onClick={() => onChange('')}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
