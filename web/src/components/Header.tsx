import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { getApiBaseUrl } from '../services/apiConfig';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // 初回読み込みとlocalStorageの変更を監視
    const updateUrl = () => {
      setApiUrl(getApiBaseUrl());
    };

    updateUrl();

    // localStorageの変更を監視
    window.addEventListener('storage', updateUrl);

    return () => {
      window.removeEventListener('storage', updateUrl);
    };
  }, []);

  // URLからホスト名を抽出
  const getHostname = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
    } catch {
      return url;
    }
  };

  return (
    <header className="bg-mas-bg-panel border-b border-mas-border flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/mas-icon.png" alt="MAS" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-mas-purple">MAS</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-mas-text-muted">
              <span className="font-mono text-mas-text-secondary">{getHostname(apiUrl)}</span>
            </div>
            <button
              onClick={onSettingsClick}
              className="p-1.5 text-mas-text-muted hover:text-mas-text-secondary transition-colors duration-200"
              title="API Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};