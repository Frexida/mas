import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  Terminal,
  CheckCircle,
  PauseCircle,
  XCircle,
  AlertCircle,
  Loader,
  FileText
} from 'lucide-react';
import type { SessionInfo, SessionStatus, RunsResponse } from '../types/masApi';
import { useSessionList } from '../hooks/useSessionList';

interface SessionSelectorProps {
  onSessionSelected: (session: RunsResponse) => void;
  onCreateNew: () => void;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  onSessionSelected,
  onCreateNew
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');

  const {
    sessions,
    loading,
    error,
    refreshSessions,
    connectSession,
    restoreSession,
    clearError
  } = useSessionList({
    autoRefresh: true,
    refreshInterval: 30000,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter
  });

  const [restoringSession, setRestoringSession] = useState<string | null>(null);

  // Filter sessions based on search term
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;

    const term = searchTerm.toLowerCase();
    return sessions.filter(session =>
      session.sessionId.toLowerCase().includes(term) ||
      session.tmuxSession.toLowerCase().includes(term) ||
      session.workingDir.toLowerCase().includes(term)
    );
  }, [sessions, searchTerm]);

  const handleSessionConnect = async (session: SessionInfo) => {
    try {
      const response = await connectSession(session.sessionId);
      onSessionSelected(response);
    } catch (err) {
      console.error('Failed to connect to session:', err);
    }
  };

  const handleSessionRestore = async (session: SessionInfo, withAgents: boolean = false) => {
    try {
      setRestoringSession(session.sessionId);
      await restoreSession(session.sessionId, withAgents);

      // After successful restoration, connect to the session
      setTimeout(async () => {
        try {
          const connectResponse = await connectSession(session.sessionId);
          onSessionSelected(connectResponse);
        } catch (err) {
          console.error('Failed to connect after restore:', err);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setRestoringSession(null);
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-mas-status-ok" />;
      case 'inactive':
        return <PauseCircle className="w-4 h-4 text-mas-status-off" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-mas-status-error" />;
      case 'restoring':
        return <Loader className="w-4 h-4 text-mas-blue animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-mas-bg-subtle text-mas-status-ok border-mas-border';
      case 'inactive':
        return 'bg-mas-bg-subtle text-mas-status-off border-mas-border';
      case 'terminated':
        return 'bg-mas-bg-subtle text-mas-status-error border-mas-border';
      default:
        return 'bg-mas-bg-subtle text-mas-text-muted border-mas-border';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-full h-full layout-full-width p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-mas-text">Select session</h1>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-mas-blue text-mas-bg-root font-medium rounded-md hover:bg-mas-blue-soft transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create new session
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-mas-bg-panel border border-mas-border rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-mas-status-error mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-mas-status-error">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-mas-text-muted hover:text-mas-text"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mas-text-muted" />
          <input
            type="text"
            placeholder="Search sessions by ID, name, or directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-mas-bg-panel border border-mas-border rounded-md text-mas-text placeholder-mas-text-muted focus:outline-none focus:ring-2 focus:ring-mas-blue focus:border-mas-blue"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
          className="px-4 py-2 bg-mas-bg-panel border border-mas-border rounded-md text-mas-text focus:outline-none focus:ring-2 focus:ring-mas-blue focus:border-mas-blue"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <button
          onClick={refreshSessions}
          disabled={loading}
          className="px-3 py-2 border border-mas-border rounded-md hover:bg-mas-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-mas-text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-mas-text-secondary">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading sessions...</span>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-mas-bg-panel border border-mas-border rounded-md p-4">
          <p className="text-sm text-mas-text-secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'No sessions found matching your filters.'
              : 'No active sessions. Create a new session to get started.'}
          </p>
        </div>
      ) : (
        <div className="session-list-row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => {
                // Don't trigger connect for terminated sessions
                if (session.status !== 'terminated') {
                  handleSessionConnect(session);
                }
              }}
              className={`bg-mas-bg-panel border border-mas-border rounded-lg p-4 transition-all ${
                session.status === 'terminated' ? 'cursor-default' : 'hover:border-mas-blue-soft hover:bg-mas-bg-subtle cursor-pointer'
              }`}
            >
              {/* Layer 1: Essential info */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(session.status)}
                  <span className="font-semibold text-mas-text">{session.tmuxSession}</span>
                </div>
                <span className="text-xs text-mas-text-muted">
                  {getRelativeTime(session.startedAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-mas-text-secondary">
                <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
                {session.agentCount !== undefined && (
                  <span className="text-xs text-mas-text-muted">
                    {session.agentCount} agents
                  </span>
                )}
              </div>

              {/* Layer 2: Technical details (collapsible) */}
              <details className="mt-3 pt-3 border-t border-mas-border" onClick={(e) => e.stopPropagation()}>
                <summary className="text-xs text-mas-text-muted cursor-pointer hover:text-mas-text-secondary">
                  View details
                </summary>
                <div className="mt-2 space-y-1 text-xs font-mono text-mas-text-muted">
                  <div>
                    <span className="text-mas-text-secondary">ID:</span> {session.sessionId}
                  </div>
                  <div className="truncate">
                    <span className="text-mas-text-secondary">Path:</span> {session.workingDir}
                  </div>
                  <div>
                    <span className="text-mas-text-secondary">Created:</span> {formatDate(session.startedAt)}
                  </div>
                  {session.lastActivity && (
                    <div>
                      <span className="text-mas-text-secondary">Last activity:</span> {getRelativeTime(session.lastActivity)}
                    </div>
                  )}
                </div>
              </details>

                {/* View Docs button for any session with documents */}
                {(session.status === 'active' || session.status === 'inactive' || session.status === 'terminated') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-mas-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/docs?sessionId=${session.sessionId}`);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-mas-bg-subtle text-mas-text-secondary rounded-md hover:bg-mas-blue-muted hover:text-mas-text transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View docs
                    </button>
                    {session.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionConnect(session);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-mas-blue-muted text-mas-blue rounded-md hover:bg-mas-blue hover:text-mas-bg-root transition-colors flex items-center justify-center gap-2"
                      >
                        <Terminal className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                )}

                {/* Restore buttons for terminated sessions */}
                {session.status === 'terminated' && session.restorable !== false && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-mas-border">
                    {restoringSession === session.sessionId ? (
                      <div className="flex items-center gap-2 text-sm text-mas-blue">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Restoring session...</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionRestore(session, true);
                          }}
                          disabled={loading || restoringSession !== null}
                          className="flex-1 px-3 py-2 text-sm font-medium text-mas-bg-root bg-mas-blue hover:bg-mas-blue-soft disabled:bg-mas-bg-subtle disabled:text-mas-text-muted rounded-md transition-colors disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            Restore
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionRestore(session, false);
                          }}
                          disabled={loading || restoringSession !== null}
                          className="px-3 py-2 text-sm font-medium text-mas-text-secondary bg-mas-bg-subtle hover:bg-mas-bg-panel disabled:text-mas-text-muted rounded-md transition-colors disabled:cursor-not-allowed border border-mas-border"
                          title="Restore without agents"
                        >
                          No agents
                        </button>
                      </>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {loading && sessions.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 text-sm text-mas-text-secondary">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Refreshing sessions...</span>
          </div>
        </div>
      )}
    </div>
  );
};