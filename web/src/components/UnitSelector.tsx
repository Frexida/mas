import React from 'react';

interface UnitSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label htmlFor="unit-count" className="block text-sm font-medium text-mas-text-secondary mb-2">
        Number of units
      </label>
      <select
        id="unit-count"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full rounded-md bg-mas-bg-panel border-mas-border shadow-sm focus:border-mas-blue focus:ring-mas-blue sm:text-sm px-3 py-2 border text-mas-text"
      >
        {[1, 2, 3, 4].map((num) => (
          <option key={num} value={num}>
            {num} {num === 1 ? 'Unit' : 'Units'}
          </option>
        ))}
      </select>
      <p className="mt-1 text-sm text-mas-text-muted">
        Each unit consists of 1 manager and 1-5 workers (configurable)
      </p>
    </div>
  );
};