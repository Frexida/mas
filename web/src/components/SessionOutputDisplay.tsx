import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionDisplay } from './SessionDisplay';
import { MessageSender } from './MessageSender';
import type { RunsResponse, ErrorResponse } from '../types/masApi';
import { isErrorResponse } from '../types/masApi';
import { AlertCircle, RefreshCw, FileText } from 'lucide-react';

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Error Creating Session
              </h3>
              <p className="text-red-800">
                {response.error}
                {response.code && (
                  <span className="ml-2 text-sm text-red-600">
                    (Code: {response.code})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Back to Configuration</span>
        </button>
      </div>
    );
  }

  // Success response - cast to RunsResponse
  const sessionResponse = response as RunsResponse;

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Session Information</h2>
        <div className="space-x-2">
          <button
            onClick={() => navigate(`/docs?sessionId=${sessionResponse.sessionId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <FileText size={18} />
            <span>View Docs</span>
          </button>
          <button
            onClick={() => setShowMessageSender(!showMessageSender)}
            className={`px-4 py-2 rounded transition-colors ${
              showMessageSender
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showMessageSender ? 'Hide Message Sender' : 'Send Message'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            New Configuration
          </button>
        </div>
      </div>

      <SessionDisplay session={sessionResponse} />

      {showMessageSender && (
        <div className="mt-6">
          <MessageSender tmuxSession={sessionResponse.tmuxSession} />
        </div>
      )}
    </div>
  );
};