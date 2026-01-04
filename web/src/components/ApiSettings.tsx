import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import {
  loadApiConfig,
  saveApiConfig,
  PRESET_URLS,
  resetApiConfig,
  getApiBaseUrl
} from '../services/apiConfig';

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setIsVisible(true));

      const config = loadApiConfig();
      const currentUrl = config.customUrl || config.baseUrl;

      const preset = PRESET_URLS.find(p => p.value === currentUrl);
      if (preset && preset.value !== 'custom') {
        setSelectedUrl(preset.value);
        setIsCustom(false);
      } else {
        setSelectedUrl('custom');
        setCustomUrl(currentUrl);
        setIsCustom(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for transition
  };

  const handleSave = () => {
    const config = {
      baseUrl: isCustom ? customUrl : selectedUrl,
      customUrl: isCustom ? customUrl : undefined
    };
    saveApiConfig(config);
    handleClose();
    onSave?.();
    setTimeout(() => window.location.reload(), 200);
  };

  const handleReset = () => {
    resetApiConfig();
    const config = loadApiConfig();
    setSelectedUrl(config.baseUrl);
    setIsCustom(false);
    setCustomUrl('');
  };

  const handleUrlChange = (value: string) => {
    setSelectedUrl(value);
    setIsCustom(value === 'custom');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-mas-bg-panel border-l border-mas-border z-50
          transform transition-transform duration-200 ease-out
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-mas-border">
            <span className="text-sm font-medium text-mas-text">API Settings</span>
            <button
              onClick={handleClose}
              className="p-1 text-mas-text-muted hover:text-mas-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-xs text-mas-text-muted mb-1">Current</div>
              <div className="font-mono text-sm text-mas-text-secondary break-all">
                {getApiBaseUrl()}
              </div>
            </div>

            <div className="border-t border-mas-border pt-4">
              <label className="block text-xs text-mas-text-muted mb-2">
                Endpoint
              </label>
              <select
                value={selectedUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-mas-bg-subtle border border-mas-border rounded text-mas-text focus:outline-none focus:border-mas-blue transition-colors"
              >
                {PRESET_URLS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {isCustom && (
              <div>
                <label className="block text-xs text-mas-text-muted mb-2">
                  Custom URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2 text-sm bg-mas-bg-subtle border border-mas-border rounded text-mas-text placeholder-mas-text-muted focus:outline-none focus:border-mas-blue transition-colors"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-mas-border space-y-2">
            <button
              onClick={handleSave}
              className="w-full bg-mas-blue text-mas-bg-root px-4 py-2 rounded text-sm hover:bg-mas-blue-soft transition-colors flex items-center justify-center gap-2"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm text-mas-text-muted hover:text-mas-text-secondary transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Reset to default
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApiSettings;
