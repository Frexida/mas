import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ChannelSelector from '../components/chat/ChannelSelector';
import MessageList from '../components/chat/MessageList';
import {
  getMessageLogs,
  getMonitorStatus,
  startMonitor,
  stopMonitor,
  type Channel,
  type MessageLog,
} from '../services/messageApi';

const REFRESH_INTERVAL = 5000; // 5 seconds
const PAGE_SIZE = 50;

const ChatViewer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';

  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [monitorLoading, setMonitorLoading] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async (before?: string) => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getMessageLogs(sessionId, {
        channel: selectedChannel,
        limit: PAGE_SIZE,
        before,
      });

      if (before) {
        // Append older messages
        setMessages((prev) => [...prev, ...response.logs]);
      } else {
        // Replace with new messages
        setMessages(response.logs);
      }

      setHasMore(response.logs.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedChannel]);

  // Fetch monitor status
  const fetchMonitorStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const status = await getMonitorStatus(sessionId);
      setMonitoring(status.monitoring);
    } catch {
      // Ignore errors for status check
    }
  }, [sessionId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();
    fetchMonitorStatus();

    const interval = setInterval(() => {
      fetchMessages();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchMessages, fetchMonitorStatus]);

  // Handle channel change
  const handleChannelChange = (channel: Channel) => {
    setSelectedChannel(channel);
    setMessages([]);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (messages.length > 0) {
      const oldestMessage = messages[messages.length - 1];
      fetchMessages(oldestMessage.timestamp);
    }
  };

  // Toggle monitor
  const handleToggleMonitor = async () => {
    if (!sessionId) return;

    setMonitorLoading(true);
    try {
      if (monitoring) {
        await stopMonitor(sessionId);
        setMonitoring(false);
      } else {
        await startMonitor(sessionId);
        setMonitoring(true);
      }
    } catch (err) {
      console.error('Failed to toggle monitor:', err);
    } finally {
      setMonitorLoading(false);
    }
  };

  // No session warning
  if (!sessionId) {
    return (
      <div className="h-full flex flex-col bg-mas-bg-root">
        <div className="bg-mas-bg-panel border-b border-mas-border px-4 py-2 flex items-center flex-shrink-0">
          <button onClick={() => navigate(-1)} className="mr-4 px-3 py-1 text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text rounded transition-colors">
            Back
          </button>
          <h1 className="text-lg font-medium text-mas-text">Chat history</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="bg-mas-bg-panel border border-mas-border rounded-lg p-6">
              <h3 className="text-lg font-medium text-mas-text mb-2">No session selected</h3>
              <p className="text-sm text-mas-text-secondary mb-4">
                Please select a session first to view chat history.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-mas-blue text-mas-bg-root rounded-md hover:bg-mas-blue-soft transition-colors"
              >
                Go to session selector
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-mas-bg-root">
      {/* Header */}
      <div className="bg-mas-bg-panel border-b border-mas-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 px-3 py-1 text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text rounded transition-colors">
            Back
          </button>
          <h1 className="text-lg font-medium text-mas-text">Chat history</h1>
          <span className="ml-2 text-sm text-mas-text-muted">({sessionId})</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Monitor toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-mas-text-secondary">Stale monitor:</span>
            <button
              onClick={handleToggleMonitor}
              disabled={monitorLoading}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                monitoring
                  ? 'bg-mas-bg-subtle text-mas-status-ok border border-mas-border'
                  : 'bg-mas-bg-subtle text-mas-text-muted border border-mas-border'
              } disabled:opacity-50`}
            >
              {monitorLoading ? '...' : monitoring ? 'ON' : 'OFF'}
            </button>
          </div>
          {/* Refresh button */}
          <button
            onClick={() => fetchMessages()}
            className="px-3 py-1 text-sm bg-mas-bg-subtle text-mas-text-secondary border border-mas-border hover:bg-mas-bg-panel rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Channel Sidebar */}
        <div className="w-48 border-r border-mas-border bg-mas-bg-panel">
          <ChannelSelector
            selectedChannel={selectedChannel}
            onSelectChannel={handleChannelChange}
          />
        </div>

        {/* Message List */}
        <div className="flex-1">
          <MessageList
            messages={messages}
            loading={loading}
            error={error}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatViewer;
