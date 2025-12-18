import React from 'react';
import {
  Play,
  Copy,
  CheckCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';
import type { SessionInfo, SessionStatus } from '../types/masApi';

interface SessionListProps {
  sessions: SessionInfo[];
  onConnect: (session: SessionInfo) => void;
  loading?: boolean;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onConnect,
  loading = false
}) => {
  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      default:
        return null;
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-300',
      inactive: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      terminated: 'bg-red-100 text-red-800 border-red-300'
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
        <p className="text-gray-500">No sessions available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tmux Session
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Session ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working Directory
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Activity
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agents
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sessions.map((session) => (
            <tr
              key={session.sessionId}
              className={`hover:bg-gray-50 ${loading ? 'opacity-50' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(session.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{session.tmuxSession}</span>
                  <button
                    onClick={(e) => copyToClipboard(session.tmuxSession, e)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy tmux session name"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-sm max-w-[150px] truncate"
                    title={session.sessionId}
                  >
                    {session.sessionId}
                  </span>
                  <button
                    onClick={(e) => copyToClipboard(session.sessionId, e)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy session ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className="font-mono text-sm max-w-[200px] truncate block"
                  title={session.workingDir}
                >
                  {session.workingDir}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(session.startedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {session.lastActivity ? formatDate(session.lastActivity) : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {session.agentCount !== undefined ? session.agentCount : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => onConnect(session)}
                  disabled={session.status === 'terminated' || loading}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  title="Connect to this session"
                >
                  <Play className="w-4 h-4" />
                  Connect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};