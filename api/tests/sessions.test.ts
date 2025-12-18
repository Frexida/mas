/**
 * Session management API tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE_URL = 'http://localhost:8765';

describe('Session Management API', () => {
  let testSessionName: string | null = null;

  beforeAll(async () => {
    // Ensure API server is running
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);
    } catch (error) {
      throw new Error('API server is not running. Please start it first.');
    }
  });

  afterAll(async () => {
    // Clean up test session if created
    if (testSessionName) {
      try {
        await execAsync(`tmux kill-session -t ${testSessionName}`);
      } catch (error) {
        // Session might already be killed
      }
    }
  });

  describe('GET /sessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('timestamp');
      expect(Array.isArray(data.sessions)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await fetch(`${API_BASE_URL}/sessions?limit=10&offset=0`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('total');
    });

    it('should support status filtering', async () => {
      const response = await fetch(`${API_BASE_URL}/sessions?status=active`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessions');
      expect(Array.isArray(data.sessions)).toBe(true);
    });

    it('should return sessions when they exist', async () => {
      // Create a test tmux session
      testSessionName = `mas-test${Date.now().toString(36).slice(-8)}`;
      await execAsync(`tmux new-session -d -s ${testSessionName}`);

      // Wait a moment for session to be created
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(`${API_BASE_URL}/sessions`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.sessions.length).toBeGreaterThan(0);

      const testSession = data.sessions.find((s: any) =>
        s.tmuxSession === testSessionName
      );
      expect(testSession).toBeDefined();
      expect(testSession).toHaveProperty('sessionId');
      expect(testSession).toHaveProperty('status');
    });
  });

  describe('GET /sessions/:sessionId', () => {
    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '12345678-1234-1234-1234-123456789abc';
      const response = await fetch(`${API_BASE_URL}/sessions/${fakeSessionId}`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    });

    it('should return session details when session exists', async () => {
      // Ensure test session exists
      if (!testSessionName) {
        testSessionName = `mas-test${Date.now().toString(36).slice(-8)}`;
        await execAsync(`tmux new-session -d -s ${testSessionName}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get session ID from list
      const listResponse = await fetch(`${API_BASE_URL}/sessions`);
      const listData = await listResponse.json();
      const testSession = listData.sessions.find((s: any) =>
        s.tmuxSession === testSessionName
      );

      if (!testSession) {
        throw new Error('Test session not found in list');
      }

      // Get session details
      const response = await fetch(`${API_BASE_URL}/sessions/${testSession.sessionId}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('tmuxSession');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('windows');
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.windows)).toBe(true);
      expect(Array.isArray(data.agents)).toBe(true);
    });
  });

  describe('POST /sessions/:sessionId/connect', () => {
    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '12345678-1234-1234-1234-123456789abc';
      const response = await fetch(`${API_BASE_URL}/sessions/${fakeSessionId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return connection info for existing session', async () => {
      // Ensure test session exists
      if (!testSessionName) {
        testSessionName = `mas-test${Date.now().toString(36).slice(-8)}`;
        await execAsync(`tmux new-session -d -s ${testSessionName}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get session ID
      const listResponse = await fetch(`${API_BASE_URL}/sessions`);
      const listData = await listResponse.json();
      const testSession = listData.sessions.find((s: any) =>
        s.tmuxSession === testSessionName
      );

      if (!testSession) {
        throw new Error('Test session not found');
      }

      // Connect to session
      const response = await fetch(`${API_BASE_URL}/sessions/${testSession.sessionId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reconnect: false })
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('tmuxSession');
      expect(data).toHaveProperty('attachCommand');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('connected');
      expect(data.attachCommand).toContain('tmux attach-session');
    });

    it('should support window parameter', async () => {
      // Get session ID
      const listResponse = await fetch(`${API_BASE_URL}/sessions`);
      const listData = await listResponse.json();
      const testSession = listData.sessions.find((s: any) =>
        s.tmuxSession === testSessionName
      );

      if (!testSession) {
        throw new Error('Test session not found');
      }

      // Connect with window parameter
      const response = await fetch(`${API_BASE_URL}/sessions/${testSession.sessionId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconnect: false,
          window: 'meta'
        })
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.attachCommand).toContain(':meta');
      expect(data.connectionDetails?.focusedWindow).toBe('meta');
    });
  });

  describe('POST /sessions/:sessionId/stop', () => {
    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = '12345678-1234-1234-1234-123456789abc';
      const response = await fetch(`${API_BASE_URL}/sessions/${fakeSessionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(404);
    });

    it('should stop an existing session', async () => {
      // Create a dedicated session for stop test
      const stopTestSession = `mas-stop${Date.now().toString(36).slice(-8)}`;
      await execAsync(`tmux new-session -d -s ${stopTestSession}`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get session ID
      const listResponse = await fetch(`${API_BASE_URL}/sessions`);
      const listData = await listResponse.json();
      const session = listData.sessions.find((s: any) =>
        s.tmuxSession === stopTestSession
      );

      if (!session) {
        throw new Error('Stop test session not found');
      }

      // Stop the session
      const response = await fetch(`${API_BASE_URL}/sessions/${session.sessionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('stopped');

      // Verify session is stopped
      await new Promise(resolve => setTimeout(resolve, 500));
      const verifyResponse = await fetch(`${API_BASE_URL}/sessions`);
      const verifyData = await verifyResponse.json();
      const stoppedSession = verifyData.sessions.find((s: any) =>
        s.tmuxSession === stopTestSession
      );
      expect(stoppedSession).toBeUndefined();
    });
  });

  describe('GET /sessions/:sessionId/agents', () => {
    it('should return agents status for session', async () => {
      // Ensure test session exists
      if (!testSessionName) {
        testSessionName = `mas-test${Date.now().toString(36).slice(-8)}`;
        await execAsync(`tmux new-session -d -s ${testSessionName}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get session ID
      const listResponse = await fetch(`${API_BASE_URL}/sessions`);
      const listData = await listResponse.json();
      const testSession = listData.sessions.find((s: any) =>
        s.tmuxSession === testSessionName
      );

      if (!testSession) {
        throw new Error('Test session not found');
      }

      // Get agents status
      const response = await fetch(`${API_BASE_URL}/sessions/${testSession.sessionId}/agents`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);

      if (data.agents.length > 0) {
        const agent = data.agents[0];
        expect(agent).toHaveProperty('agentId');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('status');
        expect(agent).toHaveProperty('window');
        expect(agent).toHaveProperty('pane');
      }
    });
  });
});