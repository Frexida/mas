/**
 * Hook for managing tmux session list
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listSessions,
  getSession,
  connectToSession,
  restoreSession
} from '../services/masApi';
import type {
  SessionInfo,
  SessionListResponse,
  SessionStatus,
  RunsResponse,
  RestoreResponse
} from '../types/masApi';

export interface UseSessionListOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  statusFilter?: SessionStatus;
}

export interface UseSessionListResult {
  sessions: SessionInfo[];
  loading: boolean;
  error: string | null;
  selectedSession: SessionInfo | null;
  refreshSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  connectSession: (sessionId: string) => Promise<RunsResponse>;
  restoreSession: (sessionId: string, startAgents?: boolean) => Promise<RestoreResponse>;
  clearError: () => void;
}

export function useSessionList(options: UseSessionListOptions = {}): UseSessionListResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    statusFilter
  } = options;

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);

  // Fetch sessions from API
  const refreshSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: SessionListResponse = await listSessions({
        status: statusFilter
      });

      setSessions(response.sessions);

      // If selected session is not in the list anymore, clear it
      if (selectedSession && !response.sessions.find(s => s.sessionId === selectedSession.sessionId)) {
        setSelectedSession(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedSession]);

  // Select a specific session
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Find in local list first
      const localSession = sessions.find(s => s.sessionId === sessionId);
      if (localSession) {
        setSelectedSession(localSession);
      } else {
        // If not found locally, fetch from API
        const session = await getSession(sessionId);
        setSelectedSession(session);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select session';
      setError(errorMessage);
      console.error('Error selecting session:', err);
    } finally {
      setLoading(false);
    }
  }, [sessions]);

  // Connect to a session
  const connectSession = useCallback(async (sessionId: string): Promise<RunsResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await connectToSession(sessionId);

      // Select the session after successful connection
      await selectSession(sessionId);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to session';
      setError(errorMessage);
      console.error('Error connecting to session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectSession]);

  // Restore a terminated session
  const restoreSessionCallback = useCallback(async (
    sessionId: string,
    startAgents: boolean = false
  ): Promise<RestoreResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await restoreSession(sessionId, { startAgents });

      // Refresh sessions after successful restoration
      await refreshSessions();

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore session';
      setError(errorMessage);
      console.error('Error restoring session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshSessions]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    refreshSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshSessions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshSessions]);

  return {
    sessions,
    loading,
    error,
    selectedSession,
    refreshSessions,
    selectSession,
    connectSession,
    restoreSession: restoreSessionCallback,
    clearError
  };
}