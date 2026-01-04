import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionDisplay } from './SessionDisplay';
import { MessageSenderWithTemplates } from './MessageSenderWithTemplates';
import type { RunsResponse, ErrorResponse } from '../types/masApi';
import { isErrorResponse } from '../types/masApi';
import { AlertCircle, RefreshCw, FileText, MessageSquare } from 'lucide-react';

interface SessionOutputDisplayProps {
  response: RunsResponse | ErrorResponse | null;
  onReset: () => void;
}

export const SessionOutputDisplay: React.FC<SessionOutputDisplayProps> = ({
  response,
  onReset
}) => {
  const navigate = useNavigate();
  const [showMessageSender, setShowMessageSender] = useState(false);

  if (!response) {
    return null;
  }

  // Handle error response
  if (isErrorResponse(response)) {
    return (
      <div className="w-full h-full overflow-y-auto p-6">
        <div className="bg-mas-bg-panel border border-mas-border rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-mas-status-error mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-mas-status-error mb-2">
                Error creating session
              </h3>
              <p className="text-mas-text-secondary">
                {response.error}
                {response.code && (
                  <span className="ml-2 text-sm text-mas-text-muted">
                    (Code: {response.code})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel hover:text-mas-text transition-colors"
        >
          <RefreshCw size={18} />
          <span>Back to configuration</span>
        </button>
      </div>
    );
  }

  // Success response - cast to RunsResponse
  const sessionResponse = response as RunsResponse;

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-mas-text">Session information</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/docs?sessionId=${sessionResponse.sessionId}`)}
            className="px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel hover:text-mas-text transition-colors flex items-center space-x-2"
          >
            <FileText size={18} />
            <span>Docs</span>
          </button>
          <button
            onClick={() => navigate(`/chat?sessionId=${sessionResponse.sessionId}`)}
            className="px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel hover:text-mas-text transition-colors flex items-center space-x-2"
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setShowMessageSender(!showMessageSender)}
            className={`px-4 py-2 rounded transition-colors ${
              showMessageSender
                ? 'bg-mas-bg-subtle text-mas-text-secondary border border-mas-border hover:bg-mas-bg-panel'
                : 'bg-mas-blue text-mas-bg-root hover:bg-mas-blue-soft'
            }`}
          >
            {showMessageSender ? 'Hide message sender' : 'Send message'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded hover:bg-mas-bg-panel hover:text-mas-text transition-colors"
          >
            New configuration
          </button>
        </div>
      </div>

      <SessionDisplay session={sessionResponse} />

      {showMessageSender && (
        <div className="mt-6">
          <MessageSenderWithTemplates tmuxSession={sessionResponse.tmuxSession} />
        </div>
      )}
    </div>
  );
};