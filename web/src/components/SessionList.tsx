import React, { useState } from 'react';
import {
  Play,
  Copy,
  CheckCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
  Loader
} from 'lucide-react';
import type { SessionInfo, SessionStatus } from '../types/masApi';
import { restoreSession } from '../services/masApi';

interface SessionListProps {
  sessions: SessionInfo[];
  onConnect: (session: SessionInfo) => void;
  loading?: boolean;
  onSessionsUpdate?: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onConnect,
  loading = false,
  onSessionsUpdate
}) => {
  const [restoringSession, setRestoringSession] = useState<string | null>(null);
  const [restorationError, setRestorationError] = useState<{ sessionId: string; message: string } | null>(null);

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRestore = async (session: SessionInfo, withAgents: boolean = false) => {
    setRestoringSession(session.sessionId);
    setRestorationError(null);

    try {
      const response = await restoreSession(session.sessionId, { startAgents: withAgents });
      console.log('Session restored:', response);

      // Refresh the session list after successful restoration
      if (onSessionsUpdate) {
        onSessionsUpdate();
      }

      // Auto-connect to the restored session after a brief delay
      setTimeout(() => {
        const restoredSession = { ...session, status: 'inactive' as SessionStatus };
        onConnect(restoredSession);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to restore session:', error);
      setRestorationError({
        sessionId: session.sessionId,
        message: error.message || 'Failed to restore session'
      });
    } finally {
      setRestoringSession(null);
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-mas-status-ok" />;
      case 'inactive':
        return <PauseCircle className="w-4 h-4 text-mas-status-warning" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-mas-status-error" />;
      case 'restoring':
        return <Loader className="w-4 h-4 text-mas-blue animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusStyles = {
      active: 'bg-mas-bg-subtle text-mas-status-ok border-mas-border',
      inactive: 'bg-mas-bg-subtle text-mas-status-warning border-mas-border',
      terminated: 'bg-mas-bg-subtle text-mas-status-error border-mas-border',
      restoring: 'bg-mas-bg-subtle text-mas-blue border-mas-border'
    };

    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
    );
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

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-mas-text-muted">No sessions available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-mas-border">
        <thead className="bg-mas-bg-subtle">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Tmux session
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Session ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Working directory
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Last activity
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Agents
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-mas-text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-mas-bg-panel divide-y divide-mas-border">
          {sessions.map((session) => (
            <tr
              key={session.sessionId}
              className={`hover:bg-mas-bg-subtle ${loading ? 'opacity-50' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(session.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-mas-text">{session.tmuxSession}</span>
                  <button
                    onClick={(e) => copyToClipboard(session.tmuxSession, e)}
                    className="p-1 text-mas-text-muted hover:text-mas-text-secondary"
                    title="Copy tmux session name"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-sm text-mas-text max-w-[150px] truncate"
                    title={session.sessionId}
                  >
                    {session.sessionId}
                  </span>
                  <button
                    onClick={(e) => copyToClipboard(session.sessionId, e)}
                    className="p-1 text-mas-text-muted hover:text-mas-text-secondary"
                    title="Copy session ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className="font-mono text-sm text-mas-text max-w-[200px] truncate block"
                  title={session.workingDir}
                >
                  {session.workingDir}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-mas-text">
                {formatDate(session.startedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-mas-text">
                {session.lastActivity ? formatDate(session.lastActivity) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-mas-text text-center">
                {session.agentCount !== undefined ? session.agentCount : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-2">
                  {session.status === 'terminated' && session.restorable !== false ? (
                    <div className="flex flex-col gap-1">
                      {restoringSession === session.sessionId ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-mas-blue">
                          <Loader className="w-4 h-4 animate-spin" />
                          Restoring...
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(session, false)}
                            disabled={loading || restoringSession !== null}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-mas-status-ok hover:opacity-80 disabled:text-mas-text-muted disabled:cursor-not-allowed"
                            title="Restore this session"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Restore
                          </button>
                          <button
                            onClick={() => handleRestore(session, true)}
                            disabled={loading || restoringSession !== null}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-mas-status-ok hover:opacity-80 disabled:text-mas-text-muted disabled:cursor-not-allowed"
                            title="Restore with agents"
                          >
                            + Agents
                          </button>
                        </>
                      )}
                      {restorationError?.sessionId === session.sessionId && (
                        <div className="text-xs text-mas-status-error mt-1">
                          {restorationError.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onConnect(session)}
                      disabled={session.status === 'terminated' || session.status === 'restoring' || loading}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-mas-blue hover:text-mas-blue-soft disabled:text-mas-text-muted disabled:cursor-not-allowed"
                      title="Connect to this session"
                    >
                      <Play className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
