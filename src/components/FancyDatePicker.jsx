import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Fancy Date Picker Component
 * Beautiful, user-friendly date selector with animations
 */
export default function FancyDatePicker({ 
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
    
    // Validate against min/max dates
    if (minDate && selected < new Date(minDate)) return;
    if (maxDate && selected > new Date(maxDate)) return;

    setSelectedDate(selected);
    const formattedDate = selected.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const handlePrevYear = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear() - 1, displayMonth.getMonth()));
  };

  const handleNextYear = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear() + 1, displayMonth.getMonth()));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className={`block text-xs font-bold mb-2 ${disabled ? 'text-gray-400' : 'text-blue-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Input Field */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg shadow-blue-500/20'
            : 'border-blue-300 bg-white text-gray-900 hover:border-blue-400 hover:shadow-md'
        }`}
        whileHover={!disabled && { scale: 1.01 }}
        whileTap={!disabled && { scale: 0.99 }}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span>{displayValue || placeholder}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-3 left-0 right-0 bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-200"
            style={{ minWidth: '380px' }}
          >
            {/* Header with Month/Year Navigation */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {/* Year Navigation */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevYear}
                    className="p-2 hover:bg-blue-100 rounded-lg transition"
                    type="button"
                  >
                    ◀◀
                  </motion.button>
                  <span className="font-bold text-gray-800 min-w-[50px] text-center">
                    {displayMonth.getFullYear()}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextYear}
                    className="p-2 hover:bg-blue-100 rounded-lg transition"
                    type="button"
                  >
                    ▶▶
                  </motion.button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-blue-100 rounded-lg transition"
                    type="button"
                  >
                    ◀
                  </motion.button>
                  <span className="font-bold text-gray-800 min-w-[120px] text-center">
                    {monthNames[displayMonth.getMonth()]}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-blue-100 rounded-lg transition"
                    type="button"
                  >
                    ▶
                  </motion.button>
                </div>
              </div>

              {/* Quick Selection Buttons */}
              <div className="flex gap-2 justify-center flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const today = new Date();
                    setDisplayMonth(today);
                    handleDateClick(today.getDate());
                  }}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                  type="button"
                >
                  Today
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDisplayMonth(tomorrow);
                    handleDateClick(tomorrow.getDate());
                  }}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                  type="button"
                >
                  Tomorrow
                </motion.button>
              </div>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 mb-4 pb-4 border-b-2 border-gray-200">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-bold text-sm text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weeks.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const isSelected = selectedDate &&
                    day === selectedDate.getDate() &&
                    displayMonth.getMonth() === selectedDate.getMonth() &&
                    displayMonth.getFullYear() === selectedDate.getFullYear();

                  const isToday = day &&
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
                      whileHover={day && !disabled ? { scale: 1.15 } : {}}
                      whileTap={day && !disabled ? { scale: 0.9 } : {}}
                      className={`p-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        !day
                          ? 'bg-transparent'
                          : isSelected
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 scale-110'
                          : isToday
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : disabled
                          ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      {day}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
