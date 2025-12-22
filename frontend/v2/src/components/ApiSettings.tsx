import React, { useState, useEffect } from 'react';
import { Settings, X, Save, RefreshCw } from 'lucide-react';
import {
  loadApiConfig,
  saveApiConfig,
  PRESET_URLS,
  resetApiConfig,
  getApiBaseUrl
} from '../services/apiConfig';

interface ApiSettingsProps {
  onClose?: () => void;
  onSave?: () => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ onClose, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const config = loadApiConfig();
    const currentUrl = config.customUrl || config.baseUrl;

    // プリセットURLかどうかチェック
    const preset = PRESET_URLS.find(p => p.value === currentUrl);
    if (preset && preset.value !== 'custom') {
      setSelectedUrl(preset.value);
      setIsCustom(false);
    } else {
      setSelectedUrl('custom');
      setCustomUrl(currentUrl);
      setIsCustom(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    const config = {
      baseUrl: isCustom ? customUrl : selectedUrl,
      customUrl: isCustom ? customUrl : undefined
    };
    saveApiConfig(config);
    setIsOpen(false);
    onSave?.();
    // ページをリロードして新しい設定を適用
    window.location.reload();
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

  return (
    <>
      {/* 設定ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="API Settings"
      >
        <Settings size={24} />
      </button>

      {/* 設定モーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">API Settings</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current API URL: <span className="font-mono text-blue-600">{getApiBaseUrl()}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select API Endpoint
              </label>
              <select
                value={selectedUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRESET_URLS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {isCustom && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom API URL
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the base URL without /api/agents/configure
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Reset
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> For local development, use localhost URLs when the API server is running on the same machine for better stability.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiSettings;