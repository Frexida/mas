import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MAS Control Panel</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Multi-Agent System Configuration Interface
            </p>
          </div>
          <div className="text-sm text-indigo-200">
            Connected to: tmp.frexida.com
          </div>
        </div>
      </div>
    </header>
  );
};