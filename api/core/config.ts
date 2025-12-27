export interface ServerConfig {
  port: number;
  host: string;
  version: string;
  apiPath: string;
}

export function getServerConfig(version: 'v1' | 'v2' | 'v3'): ServerConfig {
  const portMap = {
    v1: 3001,
    v2: 3002,
    v3: 3003
  };

  return {
    port: Number(process.env.PORT || process.env.MAS_API_PORT || portMap[version]),
    host: process.env.HOST || process.env.MAS_API_HOST || '0.0.0.0',
    version,
    apiPath: `/api/${version}`
  };
}