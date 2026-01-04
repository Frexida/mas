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
        <div className="bg-mas-bg-subtle border border-mas-status-error text-mas-status-error px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {response.message}</span>
        </div>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel transition-colors"
        >
          Back to configuration
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
        <h2 className="text-2xl font-bold text-mas-text">Generated output</h2>
        <div className="space-x-2">
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-mas-status-ok text-mas-bg-root rounded hover:opacity-90 transition-colors"
          >
            Download all
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel transition-colors"
          >
            New configuration
          </button>
        </div>
      </div>

      {response.files && response.files.length > 0 && (
        <>
          {/* Tabs */}
          <div className="border-b border-mas-border">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {response.files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === index
                      ? 'border-mas-blue text-mas-blue'
                      : 'border-transparent text-mas-text-muted hover:text-mas-text-secondary hover:border-mas-border'
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
              <div className="bg-mas-bg-panel border border-mas-border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-mas-text">
                    {response.files[activeTab].name}
                  </h3>
                  <button
                    onClick={() => handleDownload(response.files[activeTab])}
                    className="text-sm px-3 py-1 bg-mas-blue-muted text-mas-blue rounded hover:bg-mas-blue hover:text-mas-bg-root transition-colors"
                  >
                    Download
                  </button>
                </div>
                <div className="prose prose-invert w-full text-mas-text">
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
        <div className="bg-mas-bg-subtle border border-mas-status-warning text-mas-status-warning px-4 py-3 rounded">
          No output files were generated.
        </div>
      )}
    </div>
  );
};
