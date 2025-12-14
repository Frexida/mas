export interface AgentPrompt {
  id: string;
  prompt: string;
  role: 'meta-manager' | 'manager' | 'worker';
}

export interface Unit {
  manager: AgentPrompt;
  workers: AgentPrompt[];
}

export interface AgentConfiguration {
  unitCount: number;
  metaManager?: AgentPrompt;
  units: Unit[];
}

export interface ApiRequest {
  units: number;
  metaManager?: {
    id: string;
    prompt: string;
  };
  units_data: Array<{
    manager: {
      id: string;
      prompt: string;
    };
    workers: Array<{
      id: string;
      prompt: string;
    }>;
  }>;
}

export interface ApiResponse {
  files: Array<{
    name: string;
    content: string;
  }>;
  status: 'success' | 'error';
  message?: string;
}