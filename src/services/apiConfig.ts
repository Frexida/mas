// API設定管理サービス

const API_CONFIG_KEY = 'mas_api_config';

export interface ApiConfig {
  baseUrl: string;
  customUrl?: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
};

// プリセットURL
export const PRESET_URLS = [
  { label: 'Local (localhost:3000)', value: 'http://localhost:3000' },
  { label: 'Local (localhost:8080)', value: 'http://localhost:8080' },
  { label: 'Custom', value: 'custom' },
];

// ローカルストレージから設定を読み込む
export const loadApiConfig = (): ApiConfig => {
  try {
    const stored = localStorage.getItem(API_CONFIG_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // Migrate from old URLs if necessary
      if (config.baseUrl && (config.baseUrl.includes('tmp.frexida.com') || config.baseUrl.includes('mas-api.frexida.com'))) {
        config.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        saveApiConfig(config); // Save corrected config
      }
      return config;
    }
  } catch (error) {
    console.error('Failed to load API config:', error);
    // エラーの場合はLocalStorageをクリアしてデフォルトに戻す
    localStorage.removeItem(API_CONFIG_KEY);
  }
  return DEFAULT_CONFIG;
};

// ローカルストレージに設定を保存
export const saveApiConfig = (config: ApiConfig): void => {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save API config:', error);
  }
};

// 現在のAPI URLを取得
export const getApiBaseUrl = (): string => {
  const config = loadApiConfig();
  let url = config.customUrl || config.baseUrl;

  // URLが正しい形式か確認し、必要に応じて修正
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // プロトコルがない場合はhttps://を追加
    url = 'https://' + url;
  }

  // 末尾のスラッシュを削除
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return url;
};

// APIエンドポイントを取得 (deprecated - use masApi.ts functions directly)
export const getApiEndpoint = (): string => {
  console.warn('getApiEndpoint is deprecated. Use masApi.ts functions directly.');
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/runs`;
};

// 設定をリセット
export const resetApiConfig = (): void => {
  saveApiConfig(DEFAULT_CONFIG);
};