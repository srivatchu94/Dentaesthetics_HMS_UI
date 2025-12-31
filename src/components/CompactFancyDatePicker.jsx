import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Compact Fancy Date Picker - Ultra-slim form-friendly design
 * Perfect for modal forms with smart date selection
 */
export default function CompactFancyDatePicker({ 
  value, 
  onChange, 
  placeholder = "Select date",
  label = "",
  required = false,
  minDate = null,
  maxDate = null,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedDate(value ? new Date(value) : null);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day) => {
    const selected = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    
    if (minDate && selected < new Date(minDate)) return;
    if (maxDate && selected > new Date(maxDate)) return;

    setSelectedDate(selected);
    const formattedDate = selected.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];
  let week = Array(firstDay).fill(null);
  
  days.forEach((day) => {
    if (week.length === 7) {
      weeks.push([...week]);
      week = [];
    }
    week.push(day);
  });
  if (week.length > 0) {
    weeks.push(week);
  }

  const isDateDisabled = (day) => {
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const displayValue = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  const isToday = selectedDate && 
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className={`block text-xs font-bold mb-2 ${disabled ? 'text-gray-400' : 'text-slate-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Input Field - Compact */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 flex items-center justify-between group ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-md'
            : 'border-slate-300 bg-white text-gray-900 hover:border-teal-400 hover:shadow-sm'
        }`}
        whileHover={!disabled && { scale: 1.01 }}
        whileTap={!disabled && { scale: 0.99 }}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base flex-shrink-0">{isToday ? '✓' : '📅'}</span>
          <span className="truncate text-left">{displayValue || placeholder}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs flex-shrink-0"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Calendar Dropdown - Compact */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 2, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 bg-white rounded-xl shadow-xl p-3 border border-slate-200"
            style={{ minWidth: '280px' }}
          >
            {/* Month/Year Header - Compact */}
            <div className="flex items-center justify-between mb-3 gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1))}
                className="p-1 hover:bg-slate-100 rounded transition text-xs"
                type="button"
              >
                ◀
              </motion.button>
              
              <div className="flex-1 text-center">
                <div className="text-xs font-bold text-slate-900">
                  {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1))}
                className="p-1 hover:bg-slate-100 rounded transition text-xs"
                type="button"
              >
                ▶
              </motion.button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-1 mb-3 pb-3 border-b border-slate-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const today = new Date();
                  setDisplayMonth(today);
                  handleDateClick(today.getDate());
                }}
                className="flex-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold hover:bg-green-200 transition"
                type="button"
              >
                Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedDate(null);
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200 transition"
                type="button"
              >
                Clear
              </motion.button>
            </div>

            {/* Day Names - Compact */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-bold text-slate-600 h-6 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid - Compact */}
            <div className="grid grid-cols-7 gap-1">
              {weeks.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const isSelected = selectedDate &&
                    day === selectedDate.getDate() &&
                    displayMonth.getMonth() === selectedDate.getMonth() &&
                    displayMonth.getFullYear() === selectedDate.getFullYear();

                  const isCurrentDay = day &&
                    day === new Date().getDate() &&
                    displayMonth.getMonth() === new Date().getMonth() &&
                    displayMonth.getFullYear() === new Date().getFullYear();

                  const disabled = day && isDateDisabled(day);

                  return (
                    <motion.button
                      key={`${weekIdx}-${dayIdx}`}
                      type="button"
                      onClick={() => day && !disabled && handleDateClick(day)}
                      disabled={disabled || !day}
                      whileHover={day && !disabled ? { scale: 1.12 } : {}}
                      whileTap={day && !disabled ? { scale: 0.85 } : {}}
                      className={`h-7 rounded text-xs font-semibold transition-all ${
                        !day
                          ? 'bg-transparent'
                          : isSelected
                          ? 'bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-md'
                          : isCurrentDay
                          ? 'bg-teal-100 text-teal-700 border border-teal-300 font-bold'
                          : disabled
                          ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-teal-50'
                      }`}
                    >
                      {day}
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer with month navigation */}
            <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear() - 1, displayMonth.getMonth()))}
                className="flex-1 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                type="button"
              >
                ← Year
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDisplayMonth(new Date())}
                className="flex-1 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                type="button"
              >
                Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear() + 1, displayMonth.getMonth()))}
                className="flex-1 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
                type="button"
              >
                Year →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
