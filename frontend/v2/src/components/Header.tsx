import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../services/apiConfig';

export const Header: React.FC = () => {
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
    <header className="bg-indigo-600 text-white flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MAS Control Panel</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Multi-Agent System Configuration Interface
            </p>
          </div>
          <div className="text-sm text-indigo-200">
            Connected to: <span className="font-mono">{getHostname(apiUrl)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};