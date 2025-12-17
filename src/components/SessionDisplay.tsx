import React, { useState } from 'react';
import { Copy, Check, Terminal, FolderOpen, Clock, Hash } from 'lucide-react';
import type { RunsResponse } from '../types/masApi';

interface SessionDisplayProps {
  session: RunsResponse;
}

export const SessionDisplay: React.FC<SessionDisplayProps> = ({ session }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const sessionItems = [
    {
      icon: Hash,
      label: 'Session ID',
      value: session.sessionId,
      field: 'sessionId',
      color: 'text-blue-600'
    },
    {
      icon: Terminal,
      label: 'Tmux Session',
      value: session.tmuxSession,
      field: 'tmuxSession',
      color: 'text-green-600'
    },
    {
      icon: FolderOpen,
      label: 'Working Directory',
      value: session.workingDir,
      field: 'workingDir',
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: 'Started At',
      value: formatTimestamp(session.startedAt),
      field: 'startedAt',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Session Created Successfully</h2>

      <div className="space-y-4">
        {sessionItems.map((item) => {
          const Icon = item.icon;
          const isCopied = copiedField === item.field;

          return (
            <div
              key={item.field}
              className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon className={`${item.color} mt-1`} size={20} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {item.label}
                </div>
                <div className="font-mono text-sm text-gray-900 break-all">
                  {item.value}
                </div>
              </div>
              {item.field !== 'startedAt' && (
                <button
                  onClick={() => copyToClipboard(item.value, item.field)}
                  className="p-2 rounded-md hover:bg-gray-200 transition-colors"
                  title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {isCopied ? (
                    <Check className="text-green-600" size={18} />
                  ) : (
                    <Copy className="text-gray-600" size={18} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Terminal className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Connect to Session</p>
            <p className="text-blue-800">
              Use the following command to attach to the tmux session:
            </p>
            <code className="block mt-2 p-2 bg-white rounded border border-blue-300 font-mono text-xs">
              tmux attach-session -t {session.tmuxSession}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};