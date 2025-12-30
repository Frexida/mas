import React from 'react';

interface UnitSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label htmlFor="unit-count" className="block text-sm font-medium text-gray-700 mb-2">
        Number of Units
      </label>
      <select
        id="unit-count"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
      >
        {[1, 2, 3, 4].map((num) => (
          <option key={num} value={num}>
            {num} {num === 1 ? 'Unit' : 'Units'}
          </option>
        ))}
      </select>
      <p className="mt-1 text-sm text-gray-500">
        Each unit consists of 1 manager and 1-5 workers (configurable)
      </p>
    </div>
  );
};