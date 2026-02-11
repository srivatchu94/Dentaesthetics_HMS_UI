import React from 'react';

/**
 * Simple, compact date picker
 * Uses native date input for a clean, space-saving UI
 */
export default function FancyDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label = "",
  required = false,
  minDate = null,
  maxDate = null,
  disabled = false,
  name = ""
}) {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className={`block text-xs font-semibold mb-1 ${disabled ? 'text-gray-400' : 'text-slate-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border transition ${
        disabled
          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          : 'border-slate-300 bg-white text-slate-900 focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-transparent'
      }`}>
        <span className="text-base">📅</span>
        <input
          type="date"
          name={name}
          value={value || ""}
          onChange={handleChange}
          required={required}
          min={minDate || undefined}
          max={maxDate || undefined}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
}
