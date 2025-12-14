import axios, { AxiosError } from 'axios';
import type { AgentConfiguration, ApiRequest, ApiResponse } from '../types/agent.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tmp.frexida.com';
const API_ENDPOINT = `${API_BASE_URL}/api/agents/configure`;

export const submitConfiguration = async (config: AgentConfiguration): Promise<ApiResponse> => {
  try {
    // Transform configuration to API format
    const apiRequest: ApiRequest = {
      units: config.unitCount,
      metaManager: config.metaManager && config.unitCount >= 2
        ? {
            id: config.metaManager.id,
            prompt: config.metaManager.prompt
          }
        : undefined,
      units_data: config.units.map(unit => ({
        manager: {
          id: unit.manager.id,
          prompt: unit.manager.prompt
        },
        workers: unit.workers.map(worker => ({
          id: worker.id,
          prompt: worker.prompt
        }))
      }))
    };

    const response = await axios.post<ApiResponse>(API_ENDPOINT, apiRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      
      // Handle specific error cases
      if (axiosError.response) {
        // Server responded with error status
        const errorMessage = axiosError.response.data?.message || 
          `Server error: ${axiosError.response.status}`;
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    // Generic error
    throw new Error('Failed to submit configuration. Please try again.');
  }
};

// Retry logic with exponential backoff
export const submitConfigurationWithRetry = async (
  config: AgentConfiguration,
  maxRetries: number = 3
): Promise<ApiResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await submitConfiguration(config);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};