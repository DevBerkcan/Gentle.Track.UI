// src/components/common/SearchableDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsText
}) => {
  const { t } = useTranslation('common');
  const resolvedPlaceholder = placeholder ?? t('searchableDropdown.placeholder');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('searchableDropdown.searchPlaceholder');
  const resolvedNoResultsText = noResultsText ?? t('status.noResults');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sublabel && option.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={`flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors ${isOpen ? 'ring-2 ring-ring' : ''}`}
        onClick={handleInputClick}
      >
        {!isOpen && selectedOption ? (
          <div className="flex flex-col">
            <div className="font-medium">{selectedOption.label}</div>
            {selectedOption.sublabel && (
              <div className="text-xs text-muted-foreground">{selectedOption.sublabel}</div>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder={isOpen ? resolvedSearchPlaceholder : resolvedPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={handleInputClick}
          />
        )}
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {resolvedNoResultsText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors ${option.id === value ? 'bg-accent font-medium' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                <div className="font-medium">{option.label}</div>
                {option.sublabel && (
                  <div className="text-xs text-muted-foreground">{option.sublabel}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
