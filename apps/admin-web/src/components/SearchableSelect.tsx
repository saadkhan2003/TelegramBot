'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowClear?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  emptyMessage?: string;
  align?: 'left' | 'right';
  maxHeight?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  searchable = true,
  allowClear = false,
  required = false,
  name,
  id,
  emptyMessage = 'No matching options found',
  align = 'left',
  maxHeight = 'max-h-60',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [dropUp, setDropUp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options into SelectOption objects
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;

    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchValue = opt.value.toLowerCase().includes(q);
      const matchSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      return matchLabel || matchValue || matchSub || matchBadge;
    });
  }, [normalizedOptions, search]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle dropdown open and auto-detect screen position (flip up if near bottom)
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setHighlightedIndex(-1);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 280px below and more space above, open upwards
        if (spaceBelow < 280 && rect.top > spaceBelow) {
          setDropUp(true);
        } else {
          setDropUp(false);
        }
      }

      // Auto-focus search input if searchable
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 60);
      }
    }
  }, [isOpen, searchable]);

  // Keep highlighted index in view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 >= filteredOptions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission support if needed */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={value}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-[4px] border transition cursor-pointer text-left w-full ${
          disabled
            ? 'bg-[#f3f2f1] text-[#a19f9d] border-[#edebe9] cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#0078d4] ring-1 ring-[#0078d4] text-[#201f1e] shadow-xs'
            : 'bg-[#faf9f8] hover:bg-white border-[#d2d0ce] hover:border-[#8a8886] text-[#201f1e] shadow-2xs'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <div className="truncate flex items-baseline gap-1.5 min-w-0">
              <span className="font-medium text-[#201f1e] truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-[#605e5c] truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#8a8886] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-[#edebe9] text-[#8a8886] hover:text-[#201f1e] transition cursor-pointer"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#605e5c] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0078d4]' : 'group-hover:text-[#201f1e]'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          className={`absolute ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'} ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 w-full min-w-[220px] bg-white rounded-[6px] border border-[#d2d0ce] shadow-fluentModal overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {/* Integrated Search Box */}
          {searchable && (
            <div className="p-2 border-b border-[#edebe9] bg-[#faf9f8] sticky top-0 z-10">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white border border-[#d2d0ce] rounded-[4px] pl-8 pr-7 py-1 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#8a8886] hover:text-[#201f1e]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List with Smooth Ultra-Thin Scrollbar */}
          <div
            ref={listRef}
            className={`${maxHeight} overflow-y-auto thin-scrollbar p-1 divide-y divide-[#faf9f8]`}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-[#8a8886]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[4px] text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#eff6fc] text-[#0078d4] font-medium'
                        : isHighlighted
                        ? 'bg-[#f3f2f1] text-[#201f1e]'
                        : 'text-[#201f1e] hover:bg-[#faf9f8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate min-w-0">
                        <div className="truncate font-medium">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-[#605e5c] truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded border font-mono font-normal ${
                            opt.badgeColor || 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#0078d4] shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
