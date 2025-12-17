# MAS Web UI

Multi-Agent System Configuration Interface for tmp.frexida.com

## Overview

This web application provides a user-friendly interface to configure and manage multi-agent systems. It allows users to:
- Configure 1-4 agent units dynamically
- Assign prompts to meta managers, unit managers, and workers
- Use predefined templates for quick agent initialization (Japanese/English)
- Automatically include MAS help command learning in agent prompts
- Submit configurations to the MAS API
- View and manage active sessions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:Frexida/mas.git
cd mas-ui-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure API endpoint in `.env`:
```
VITE_API_BASE_URL=https://tmp.frexida.com
```

### Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Architecture

### Component Structure

- **Header**: Application header with branding
- **AgentConfigurator**: Main form container
  - **UnitSelector**: Select number of units (1-4)
  - **MetaManagerInput**: Input for meta manager (shown when units >= 2)
  - **UnitConfiguration**: Configuration for each unit
    - **PromptInput**: Text input with template support
    - **TemplateSelector**: Choose and apply role-specific templates
    - **TemplatePreview**: View template before applying
- **SessionDisplay**: Show active session details
- **MessageSender**: Send messages to agents after initialization

### State Management

Uses React's `useReducer` hook for centralized form state management.

### API Integration

- **Configuration Endpoint**: `/runs`
  - **Method**: POST
  - **Retry Logic**: Exponential backoff with 3 retries
  - **Timeout**: 30 seconds
- **Message Endpoint**: `/message`
  - **Method**: POST
  - **Timeout**: 10 seconds

## Agent Hierarchy

- **Meta Manager** (ID: 00): Coordinates multiple units
- **Unit Managers** (IDs: 10, 20, 30, 40): Manage individual units
- **Workers** (IDs: 11-13, 21-23, 31-33, 41-43): Execute specific tasks

## Template System

### Features
- **Role-Specific Templates**: Pre-configured prompts for each agent role
- **Multi-Language Support**: Available in Japanese and English
- **Auto Help Integration**: Automatically includes `mas help` command instructions
- **Customization**: Templates can be edited after application
- **Persistence**: Custom templates saved in browser localStorage

### Template Content

#### Manager Template (Japanese)
- Team opinion integration instructions
- Task prioritization guidance
- Report handling procedures
- MAS help command learning

#### Worker Template (Japanese)
- Task execution instructions
- Progress reporting guidelines
- Collaboration protocols
- MAS help command learning

#### Meta-Manager Template (Japanese)
- Multi-unit coordination
- System-wide strategy
- Resource optimization
- MAS help command learning

## Technologies

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API communication
- React Markdown for rendering outputs

## Contributing

Please create a feature branch and submit a pull request for any contributions.

## License

Proprietary - Internal Use Only