// File path: client/src/components/auth/AuthInput.jsx
import React from "react";

/**
 * Modern, standardized HTML input field wrapping focus rings and labels
 */
export default function AuthInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = true,
  maxLength,
  className = "",
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${className}`}
      />
    </div>
  );
}