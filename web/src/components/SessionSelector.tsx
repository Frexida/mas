import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  Clock,
  FolderOpen,
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
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'restoring':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
        <h1 className="text-2xl font-bold text-gray-900">Select Tmux Session</h1>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Session
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions by ID, name, or directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <button
          onClick={refreshSessions}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading sessions...</span>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
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
              className={`border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all ${
                session.status === 'terminated' ? 'cursor-default' : 'hover:border-blue-300 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(session.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {getRelativeTime(session.startedAt)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">{session.tmuxSession}</span>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span>
                  <span className="font-mono ml-1">{session.sessionId}</span>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FolderOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{session.workingDir}</span>
                </div>

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Created: {formatDate(session.startedAt)}</span>
                  </div>
                  {session.agentCount !== undefined && (
                    <span className="text-xs text-gray-500">
                      {session.agentCount} agents
                    </span>
                  )}
                </div>

                {session.lastActivity && (
                  <div className="text-xs text-gray-500">
                    Last activity: {getRelativeTime(session.lastActivity)}
                  </div>
                )}

                {/* View Docs button for any session with documents */}
                {(session.status === 'active' || session.status === 'inactive' || session.status === 'terminated') && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/docs?sessionId=${session.sessionId}`);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Docs
                    </button>
                    {session.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionConnect(session);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Terminal className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                )}

                {/* Restore buttons for terminated sessions */}
                {session.status === 'terminated' && session.restorable !== false && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {restoringSession === session.sessionId ? (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
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
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors disabled:cursor-not-allowed"
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
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-md transition-colors disabled:cursor-not-allowed"
                          title="Restore without agents"
                        >
                          No Agents
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && sessions.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Refreshing sessions...</span>
          </div>
        </div>
      )}
    </div>
  );
};