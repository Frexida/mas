# MAS Web UI

Multi-Agent System Configuration Interface for tmp.frexida.com

## Overview

This web application provides a user-friendly interface to configure and manage multi-agent systems. It allows users to:
- Configure 1-4 agent units dynamically
- Assign prompts to meta managers, unit managers, and workers
- Submit configurations to tmp.frexida.com API
- View and export generated markdown outputs

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
    - **PromptInput**: Reusable text input component
- **OutputDisplay**: Display and export markdown results

### State Management

Uses React's `useReducer` hook for centralized form state management.

### API Integration

- **Endpoint**: `https://tmp.frexida.com/api/agents/configure`
- **Method**: POST
- **Retry Logic**: Exponential backoff with 3 retries
- **Timeout**: 30 seconds

## Agent Hierarchy

- **Meta Manager** (ID: 00): Coordinates multiple units
- **Unit Managers** (IDs: 10, 20, 30, 40): Manage individual units
- **Workers** (IDs: 11-13, 21-23, 31-33, 41-43): Execute specific tasks

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