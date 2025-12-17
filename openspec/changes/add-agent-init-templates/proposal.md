# Change: Add Initialization Template Messages for Agents

## Why
Users need predefined initialization messages for managers and workers to establish their roles and understand MAS system commands, reducing setup time and ensuring consistent agent behavior.

## What Changes
- Add template message system for agent initialization with role-specific defaults
- Provide manager templates with leadership and coordination instructions
- Provide worker templates with task execution and reporting instructions
- Include automatic `mas help` command injection to teach agents about available commands
- Add template customization UI with preset options and custom override
- Store template preferences for future sessions

## Impact
- Affected specs: agent-initialization (new capability)
- Affected code:
  - `src/hooks/useMasConfiguration.ts` (template integration)
  - `src/components/AgentConfigurator.tsx` (template UI)
  - `src/utils/templates.ts` (new template definitions)
  - `src/types/masApi.ts` (template type extensions)