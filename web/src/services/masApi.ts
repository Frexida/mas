/**
 * MAS API Service
 * Implements official MAS API endpoints
 */

import axios, { AxiosError } from 'axios';
import type {
  RunsRequest,
  RunsResponse,
  MessageRequest,
  MessageResponse,
  ErrorResponse,
  SessionListRequest,
  SessionListResponse,
  SessionInfo,
  RestoreRequest,
  RestoreResponse
} from '../types/masApi';
import { isErrorResponse } from '../types/masApi';
import { getApiBaseUrl } from './apiConfig';

/**
 * Creates a new MAS session
 * POST /runs
 */
export async function createRun(request: RunsRequest): Promise<RunsResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/runs`;

    console.log('Creating MAS run:', endpoint, request);

    const response = await axios.post<RunsResponse>(endpoint, request, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120 seconds (session creation + agent init takes time)
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}

/**
 * Sends a message to a tmux session
 * POST /message
 */
export async function sendMessage(request: MessageRequest): Promise<MessageResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/message`;

    console.log('Sending message:', endpoint, request);

    const response = await axios.post<MessageResponse>(endpoint, request, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}

/**
 * Handles API errors and throws user-friendly messages
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.response) {
      // Server responded with error
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      if (isErrorResponse(data)) {
        const errorMessage = data.code
          ? `${data.error} (Code: ${data.code})`
          : data.error;
        throw new Error(`API Error ${status}: ${errorMessage}`);
      }

      // Generic error response
      throw new Error(`Server Error ${status}: ${axiosError.response.statusText || 'Unknown error'}`);
    } else if (axiosError.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection and API URL.');
    } else {
      // Error in request setup
      throw new Error(`Request failed: ${axiosError.message}`);
    }
  }

  // Non-axios error
  throw new Error('An unexpected error occurred. Please try again.');
}

/**
 * Tests API connectivity
 */
export async function testApiConnection(): Promise<{
  connected: boolean;
  message: string;
  apiUrl: string;
}> {
  const apiUrl = getApiBaseUrl();

  try {
    // Try to make a HEAD request to the API base URL
    // This is a lightweight way to test connectivity
    await axios.head(apiUrl, { timeout: 5000 });

    return {
      connected: true,
      message: 'Connected successfully',
      apiUrl
    };
  } catch (error) {
    let message = 'Unable to connect to API';

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        message = 'Connection refused. Is the API server running?';
      } else if (error.code === 'ETIMEDOUT') {
        message = 'Connection timeout. Check your network.';
      } else if (error.response) {
        // Server is reachable but returned an error
        // This is actually okay for our health check
        return {
          connected: true,
          message: `API reachable (status: ${error.response.status})`,
          apiUrl
        };
      }
    }

    return {
      connected: false,
      message,
      apiUrl
    };
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function createRunWithRetry(
  request: RunsRequest,
  maxRetries: number = 3
): Promise<RunsResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createRun(request);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retry attempt ${attempt} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Lists available tmux sessions
 * GET /sessions
 */
export async function listSessions(params?: SessionListRequest): Promise<SessionListResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/sessions`;

    console.log('Listing sessions:', endpoint, params);

    const response = await axios.get<SessionListResponse>(endpoint, {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}

/**
 * Gets a specific session by ID
 * GET /sessions/:sessionId
 */
export async function getSession(sessionId: string): Promise<SessionInfo> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/sessions/${sessionId}`;

    console.log('Getting session:', endpoint);

    const response = await axios.get<SessionInfo>(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}

/**
 * Connects to an existing session
 * POST /sessions/:sessionId/connect
 * Returns the same response as creating a new session
 */
export async function connectToSession(sessionId: string): Promise<RunsResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/sessions/${sessionId}/connect`;

    console.log('Connecting to session:', endpoint);

    const response = await axios.post<RunsResponse>(endpoint, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}

/**
 * Restores a terminated session
 * POST /sessions/:sessionId/restore
 */
export async function restoreSession(
  sessionId: string,
  request?: RestoreRequest
): Promise<RestoreResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/sessions/${sessionId}/restore`;

    console.log('Restoring session:', endpoint, request);

    const response = await axios.post<RestoreResponse>(endpoint, request || {}, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 seconds (restoration can take time)
    });

    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This won't be reached due to handleApiError throwing
  }
}