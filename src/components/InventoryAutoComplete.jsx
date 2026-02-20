import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryAutoComplete({
  value,
  onChange,
  onSelect,
  masterItems = [],
  placeholder = "Search and select item...",
  onAddNewItem,
  disabled = false,
  showTaxInfo = true,
  className = ""
}) {
  const [inputValue, setInputValue] = useState(value?.itemName || '');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [itemNotFound, setItemNotFound] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update input when value changes externally
  useEffect(() => {
    if (value?.itemName && inputValue !== value.itemName) {
      setInputValue(value.itemName);
    }
  }, [value?.itemId]);

  // Handle input change and filter items
  const handleInputChange = (e) => {
    const searchTerm = e.target.value;
    setInputValue(searchTerm);
    setSelectedIndex(-1);

    if (searchTerm.trim() === '') {
      setFilteredItems([]);
      setShowDropdown(false);
      setItemNotFound(false);
      onChange?.({ itemId: 0, itemName: '' });
      return;
    }

    // Filter master items based on search term
    const filtered = masterItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredItems(filtered);
    setShowDropdown(true);
    
    // Show "Add to Master" button ONLY if NO items found (not even partial matches)
    setItemNotFound(filtered.length === 0 && searchTerm.trim().length > 0);
  };

  // Handle item selection from dropdown
  const handleSelectItem = (item) => {
    setInputValue(item.itemName);
    setFilteredItems([]);
    setShowDropdown(false);
    setItemNotFound(false);
    setSelectedIndex(-1);
    
    onSelect?.(item);
    onChange?.(item);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${itemNotFound ? 'border-amber-400' : ''}`}
          autoComplete="off"
        />
        
        {/* Search icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {/* Dropdown List */}
      <AnimatePresence>
        {showDropdown && filteredItems.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto"
          >
            {filteredItems.map((item, index) => (
              <motion.button
                key={item.itemId}
                type="button"
                data-selected={selectedIndex === index}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all ${
                  selectedIndex === index
                    ? 'bg-green-100 text-green-900 font-semibold'
                    : 'bg-white text-gray-700 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.itemName}</p>
                    <p className="text-xs text-gray-500">
                      Code: {item.itemCode} • Category: {item.category} • Unit: {item.unit}
                      {showTaxInfo ? ` • CGST: ${Number(item.cgst) || 0}% • SGST: ${Number(item.sgst) || 0}%` : ''}
                    </p>
                  </div>
                  <span className="text-lg">📦</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Not Found - Show Add Button */}
      {itemNotFound && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-amber-50 border-2 border-amber-400 rounded-lg shadow-lg p-3 z-40"
        >
          <p className="text-sm text-amber-800 mb-2">
            <span className="font-semibold">"{inputValue}"</span> not found in inventory
          </p>
          <button
            type="button"
            onClick={() => {
              setShowDropdown(false);
              onAddNewItem?.({
                itemName: inputValue,
                searchTerm: inputValue
              });
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm flex items-center justify-center gap-2"
          >
            ➕ Add to Master Inventory
          </button>
        </motion.div>
      )}

      {/* Empty State */}
      {showDropdown && filteredItems.length === 0 && !itemNotFound && inputValue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-lg p-4 z-40 text-center"
        >
          <p className="text-sm text-gray-600">No items found</p>
        </motion.div>
      )}
    </div>
  );
}
