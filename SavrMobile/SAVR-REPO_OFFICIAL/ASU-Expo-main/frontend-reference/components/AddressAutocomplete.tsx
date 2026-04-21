import React, { useState, useRef, useEffect, useCallback } from 'react';
import storeService, { type AddressSuggestion } from '@/services/storeService';
import { PROVINCE_NAME_TO_CODE, formatPostalCode } from '@/lib/addressUtils';

export interface ParsedAddress {
  street: string;
  city: string;
  province: string; // 2-letter code
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (display: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
  proximityLat?: number;
  proximityLon?: number;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  proximityLat,
  proximityLon,
  className = '',
  placeholder = 'Start typing your address...',
  required,
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suppressFetch, setSuppressFetch] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await storeService.addressSuggest(q, proximityLat, proximityLon);
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIdx(-1);
        } catch {
          setSuggestions([]);
          setOpen(false);
        }
      }, 300);
    },
    [proximityLat, proximityLon],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (suppressFetch) {
      setSuppressFetch(false);
      return;
    }
    fetchSuggestions(v);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    const provinceCode = PROVINCE_NAME_TO_CODE[s.province.toLowerCase()] || s.province;
    const postal = formatPostalCode(s.postalCode || '');
    const parsed: ParsedAddress = {
      street: s.street,
      city: s.city,
      province: provinceCode,
      postalCode: postal,
      latitude: parseFloat(s.latitude) || 0,
      longitude: parseFloat(s.longitude) || 0,
    };
    setSuppressFetch(true);
    onChange(s.place_name);
    onSelect(parsed);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => {
        const next = prev < suggestions.length - 1 ? prev + 1 : 0;
        scrollToIdx(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => {
        const next = prev > 0 ? prev - 1 : suggestions.length - 1;
        scrollToIdx(next);
        return next;
      });
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const scrollToIdx = (idx: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[idx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        className={className}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={activeIdx >= 0 ? `addr-opt-${activeIdx}` : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              id={`addr-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`cursor-pointer px-3 py-2 text-sm text-slate-800 dark:text-slate-200 ${
                i === activeIdx ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                selectSuggestion(s);
              }}
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
