import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ApiResponse } from '../types/agent.ts';

interface OutputDisplayProps {
  response: ApiResponse | null;
  onReset: () => void;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ response, onReset }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!response) {
    return null;
  }

  if (response.status === 'error') {
    return (
      <div className="w-full h-full overflow-y-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {response.message}</span>
        </div>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Configuration
        </button>
      </div>
    );
  }

  const handleDownload = (file: { name: string; content: string }) => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.endsWith('.md') ? file.name : `${file.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!response.files || response.files.length === 0) return;

    // For simplicity, download each file individually
    // In a production environment, you might want to create a zip file
    response.files.forEach(file => {
      handleDownload(file);
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Generated Output</h2>
        <div className="space-x-2">
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download All
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            New Configuration
          </button>
        </div>
      </div>

      {response.files && response.files.length > 0 && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {response.files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === index
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-6">
            {response.files[activeTab] && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {response.files[activeTab].name}
                  </h3>
                  <button
                    onClick={() => handleDownload(response.files[activeTab])}
                    className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  >
                    Download
                  </button>
                </div>
                <div className="prose w-full">
                  <ReactMarkdown>
                    {response.files[activeTab].content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {(!response.files || response.files.length === 0) && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No output files were generated.
        </div>
      )}
    </div>
  );
};