// Message Log Types

export type MessageType = 'instruction' | 'report' | 'broadcast' | 'reminder';

export type Channel = 'all' | 'unit-0' | 'unit-1' | 'unit-2' | 'unit-3';

export interface MessageLog {
  id: string;
  sessionId: string;
  timestamp: string;
  sender: string;
  target: string;
  recipients: string[];
  message: string;
  type: MessageType;
  execute: boolean;
}

export interface ReminderTrigger {
  expectedSender: string;
  expectedRecipient: string;
  lastMessageAt: string | null;
}

export interface ReminderLog extends MessageLog {
  type: 'reminder';
  reason: 'no_instruction' | 'no_report';
  triggeredBy: ReminderTrigger;
}

export interface StaleResult {
  stale: boolean;
  type?: 'instruction' | 'report';
  from?: string;
  to?: string;
  lastMessageAt?: string | null;
}

export interface MessageLogStore {
  append(log: MessageLog): Promise<void>;
  getAll(sessionId: string): Promise<MessageLog[]>;
  clear(sessionId: string): Promise<void>;
}

export interface MessageSender {
  send(target: string, message: string, sessionId: string, execute?: boolean): Promise<void>;
}
