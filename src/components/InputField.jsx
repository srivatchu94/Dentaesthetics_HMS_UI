import React from 'react';

const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  options = [],
  required = false,
  disabled = false,
  className = ''
}) => {
  const baseClassName = `w-full px-4 py-2 border border-stone-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
    disabled ? 'bg-gray-50 text-stone-500 cursor-not-allowed' : 'bg-white'
  } ${className}`;

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows="4"
          className={baseClassName}
        />
      ) : type === 'dropdown' ? (
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={baseClassName}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : options.length > 0 ? (
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={baseClassName}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={baseClassName}
        />
      )}
    </div>
  );
};

export default InputField;
