import React, { useState } from 'react';
import { Send, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import { sendMessage } from '../services/masApi';
import type { MessageRequest } from '../types/masApi';

interface MessageSenderProps {
  tmuxSession: string;
}

export const MessageSender: React.FC<MessageSenderProps> = ({ tmuxSession }) => {
  const [target, setTarget] = useState<string>('all');
  const [message, setMessage] = useState<string>('');
  const [execute, setExecute] = useState<boolean>(false);
  const [openspecProposal, setOpenspecProposal] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const targetOptions = [
    { value: 'all', label: 'All Agents' },
    { value: 'window1', label: 'Window 1' },
    { value: 'agent-00', label: 'Meta Manager (00)' },
    { value: 'agent-10', label: 'Unit 1 Manager (10)' },
    { value: 'agent-11', label: 'Unit 1 Worker 1 (11)' },
    { value: 'agent-12', label: 'Unit 1 Worker 2 (12)' },
    { value: 'agent-13', label: 'Unit 1 Worker 3 (13)' },
    { value: 'agent-20', label: 'Unit 2 Manager (20)' },
    { value: 'agent-21', label: 'Unit 2 Worker 1 (21)' },
    { value: 'custom', label: 'Custom Target' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setResult({
        type: 'error',
        message: 'Please enter a message'
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    // Prepend /openspec:proposal if the checkbox is checked
    const finalMessage = openspecProposal ? `/openspec:proposal ${message}` : message;

    const request: MessageRequest = {
      target,
      message: finalMessage,
      execute,
      session: tmuxSession
    };

    try {
      const response = await sendMessage(request);
      setResult({
        type: 'success',
        message: `Message sent to ${response.target} at ${new Date(response.timestamp).toLocaleTimeString()}`
      });
      setMessage(''); // Clear message after success
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          Send Message to Tmux Session: {tmuxSession}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target
          </label>
          {target === 'custom' ? (
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom target (e.g., agent-14)"
            />
          ) : (
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter your message or command..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="execute"
            checked={execute}
            onChange={(e) => setExecute(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="execute" className="text-sm text-gray-700">
            Execute as command (sends Enter key after message)
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="openspecProposal"
            checked={openspecProposal}
            onChange={(e) => setOpenspecProposal(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="openspecProposal" className="text-sm text-gray-700">
            Send as OpenSpec proposal (prepends /openspec:proposal)
          </label>
        </div>

        {result && (
          <div
            className={`p-3 rounded-md flex items-start space-x-2 ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="mt-0.5" size={18} />
            ) : (
              <AlertCircle className="mt-0.5" size={18} />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            isSending
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Send size={18} />
          <span>{isSending ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>
    </div>
  );
};