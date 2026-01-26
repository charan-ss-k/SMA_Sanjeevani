import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchableInput Component
 * Replaces checkbox lists with searchable, filterable input
 * As user types, items starting with that letter are shown as suggestions
 * Supports translation display via displayMap prop
 */
const SearchableInput = ({
  items = [],
  selectedItems = [],
  onSelectionChange = () => {},
  placeholder = "Search...",
  label = "",
  maxDisplay = 8,
  displayMap = null, // Optional: function(item) => translated display text
  language = 'english', // For translations
  t = (key) => key // Translation function
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Helper to get display text (translated if displayMap provided, else original)
  const getDisplayText = (item) => {
    return displayMap ? displayMap(item) : item;
  };

  // Filter items based on search input (case-insensitive, starts with match)
  // Search in both English key and translated display text
  const filteredItems = items.filter(item => {
    const displayText = getDisplayText(item);
    const matchesSearch = displayText.toLowerCase().startsWith(searchInput.toLowerCase()) ||
                          item.toLowerCase().startsWith(searchInput.toLowerCase());
    return matchesSearch && !selectedItems.includes(item);
  });

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add item to selection
  const handleAddItem = (item) => {
    onSelectionChange([...selectedItems, item]);
    setSearchInput('');
    setShowDropdown(false);
  };

  // Remove item from selection
  const handleRemoveItem = (item) => {
    onSelectionChange(selectedItems.filter(i => i !== item));
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
    setShowDropdown(true);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      handleAddItem(filteredItems[0]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Backspace' && searchInput === '' && selectedItems.length > 0) {
      handleRemoveItem(selectedItems[selectedItems.length - 1]);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      <div ref={dropdownRef} className="relative w-full">
        {/* Input Field */}
        <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
          {/* Selected Items as Chips */}
          {selectedItems.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              <span>{getDisplayText(item)}</span>
              <button
                onClick={() => handleRemoveItem(item)}
                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                title={`Remove ${getDisplayText(item)}`}
              >
                ×
              </button>
            </div>
          ))}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedItems.length === 0 ? placeholder : ""}
            value={searchInput}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[200px] outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Dropdown Suggestions */}
        {showDropdown && filteredItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {filteredItems.slice(0, maxDisplay).map((item, index) => (
              <button
                key={item}
                onClick={() => handleAddItem(item)}
                className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition ${
                  index === 0 ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-gray-800">{getDisplayText(item)}</span>
              </button>
            ))}
            {filteredItems.length > maxDisplay && (
              <div className="px-4 py-2 text-sm text-gray-500 text-center border-t">
                +{filteredItems.length - maxDisplay} more
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {showDropdown && searchInput && filteredItems.length === 0 && selectedItems.length < items.length && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-center text-gray-500">
            {t('noMatchesFound', language).replace('{search}', searchInput)}
          </div>
        )}
      </div>

      {/* Selected Count */}
      {selectedItems.length > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {t('selected', language)}: <span className="font-medium">{selectedItems.length}</span> {t('items', language)}
        </p>
      )}
    </div>
  );
};

export default SearchableInput;
