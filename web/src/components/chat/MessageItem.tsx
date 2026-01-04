import React from 'react';
import type { MessageLog } from '../../services/messageApi';
import { getAgentDisplayName, getAgentColor } from '../../services/messageApi';

interface MessageItemProps {
  message: MessageLog;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isSystem = message.sender === 'system';
  const timeStr = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const typeStyles: Record<string, string> = {
    instruction: 'border-l-mas-blue',
    report: 'border-l-mas-status-ok',
    broadcast: 'border-l-mas-status-warning',
    reminder: 'border-l-mas-status-error bg-mas-bg-subtle',
  };

  return (
    <div className={`flex gap-3 p-3 hover:bg-mas-bg-subtle border-l-4 ${typeStyles[message.type] || 'border-l-mas-border'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAgentColor(message.sender)}`}>
        {isSystem ? 'SYS' : message.sender}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-mas-text">
            {getAgentDisplayName(message.sender)}
          </span>
          <span className="text-xs text-mas-text-muted">→</span>
          <span className="text-sm text-mas-text-secondary">
            {message.target}
          </span>
          <span className="text-xs text-mas-text-muted">{timeStr}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            message.type === 'instruction' ? 'bg-mas-blue-muted text-mas-blue' :
            message.type === 'report' ? 'bg-mas-bg-subtle text-mas-status-ok' :
            message.type === 'reminder' ? 'bg-mas-bg-subtle text-mas-status-error' :
            'bg-mas-bg-subtle text-mas-text-muted'
          }`}>
            {message.type}
          </span>
        </div>

        {/* Message body */}
        <div className="text-mas-text whitespace-pre-wrap break-words">
          {message.message}
        </div>

        {/* Recipients */}
        {message.recipients.length > 0 && (
          <div className="text-xs text-mas-text-muted mt-1">
            Recipients: {message.recipients.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
