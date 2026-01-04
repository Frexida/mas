import React from 'react';
import type { Channel } from '../../services/messageApi';

interface ChannelSelectorProps {
  selectedChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
}

const channels: { id: Channel; label: string; description: string }[] = [
  { id: 'all', label: 'All', description: 'All messages' },
  { id: 'unit-0', label: 'Meta', description: 'Agent 00' },
  { id: 'unit-1', label: 'Design', description: 'Agents 10-13' },
  { id: 'unit-2', label: 'Development', description: 'Agents 20-23' },
  { id: 'unit-3', label: 'Business', description: 'Agents 30-33' },
];

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  selectedChannel,
  onSelectChannel,
}) => {
  return (
    <div className="p-4 border-b border-mas-border">
      <h2 className="text-sm font-semibold text-mas-text-muted uppercase mb-3">Channels</h2>
      <div className="space-y-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedChannel === channel.id
                ? 'bg-mas-blue-muted text-mas-blue'
                : 'text-mas-text-secondary hover:bg-mas-bg-subtle'
            }`}
          >
            <div className="font-medium"># {channel.label}</div>
            <div className="text-xs text-mas-text-muted">{channel.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChannelSelector;
