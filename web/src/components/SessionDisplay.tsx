import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
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

  return (
    <div className="bg-mas-bg-panel border border-mas-border rounded-lg p-6">
      {/* Layer 1: Essential info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-mas-text-muted mb-1">Session</div>
          <div className="text-xl font-bold text-mas-text">{session.tmuxSession}</div>
        </div>
        <button
          onClick={() => copyToClipboard(session.tmuxSession, 'tmuxSession')}
          className="p-2 rounded-md hover:bg-mas-bg-subtle transition-colors"
          title={copiedField === 'tmuxSession' ? 'Copied!' : 'Copy session name'}
        >
          {copiedField === 'tmuxSession' ? (
            <Check className="text-mas-status-ok" size={18} />
          ) : (
            <Copy className="text-mas-text-muted" size={18} />
          )}
        </button>
      </div>

      {/* Connect command */}
      <div className="p-3 bg-mas-bg-subtle border border-mas-border rounded-lg mb-4">
        <code className="font-mono text-sm text-mas-text">
          tmux attach-session -t {session.tmuxSession}
        </code>
      </div>

      {/* Layer 2: Technical details (collapsible) */}
      <details className="pt-4 border-t border-mas-border">
        <summary className="text-sm text-mas-text-muted cursor-pointer hover:text-mas-text-secondary">
          View details
        </summary>
        <div className="mt-3 space-y-2 text-sm font-mono">
          <div className="flex justify-between items-center p-2 bg-mas-bg-subtle rounded">
            <div>
              <span className="text-mas-text-muted">ID: </span>
              <span className="text-mas-text">{session.sessionId}</span>
            </div>
            <button
              onClick={() => copyToClipboard(session.sessionId, 'sessionId')}
              className="p-1 rounded hover:bg-mas-bg-panel transition-colors"
            >
              {copiedField === 'sessionId' ? (
                <Check className="text-mas-status-ok" size={14} />
              ) : (
                <Copy className="text-mas-text-muted" size={14} />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center p-2 bg-mas-bg-subtle rounded">
            <div className="flex-1 min-w-0">
              <span className="text-mas-text-muted">Path: </span>
              <span className="text-mas-text break-all">{session.workingDir}</span>
            </div>
            <button
              onClick={() => copyToClipboard(session.workingDir, 'workingDir')}
              className="p-1 rounded hover:bg-mas-bg-panel transition-colors ml-2 flex-shrink-0"
            >
              {copiedField === 'workingDir' ? (
                <Check className="text-mas-status-ok" size={14} />
              ) : (
                <Copy className="text-mas-text-muted" size={14} />
              )}
            </button>
          </div>
          <div className="p-2 bg-mas-bg-subtle rounded">
            <span className="text-mas-text-muted">Created: </span>
            <span className="text-mas-text">{formatTimestamp(session.startedAt)}</span>
          </div>
        </div>
      </details>
    </div>
  );
};