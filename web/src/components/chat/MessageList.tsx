import React, { useEffect, useRef } from 'react';
import type { MessageLog } from '../../services/messageApi';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: MessageLog[];
  loading: boolean;
  error: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  error,
  onLoadMore,
  hasMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on new messages (since we display newest first)
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-mas-text-secondary">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-mas-status-error text-center">
          <div className="text-lg font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-mas-text-secondary">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-50">—</div>
          <div>No messages yet</div>
          <div className="text-sm text-mas-text-muted">Messages will appear here when agents communicate</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {/* Load more button at top (for older messages) */}
      {hasMore && (
        <div className="p-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm bg-mas-bg-subtle text-mas-text-secondary border border-mas-border hover:bg-mas-bg-panel rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {/* Messages (newest first) */}
      <div className="divide-y divide-mas-border pb-8">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};

export default MessageList;
