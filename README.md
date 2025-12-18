# MAS-UI

A modern web interface for configuring and managing Multi-Agent Systems (MAS)

## Overview

MAS-UI is a React-based web application that provides an intuitive interface for configuring and managing multi-agent systems. It enables users to orchestrate complex agent hierarchies, assign specific roles and prompts, and monitor agent interactions in real-time.

### Key Features
- 🤖 **Dynamic Agent Configuration**: Configure 1-4 agent units with flexible hierarchies
- 📝 **Role-Based Prompting**: Assign specific prompts to meta managers, unit managers, and workers
- 🎯 **Template System**: Pre-configured templates for rapid agent initialization
- 🌐 **Multi-Language Support**: Templates available in Japanese and English
- 📡 **Real-time Session Management**: View and interact with active agent sessions
- 💬 **Interactive Messaging**: Send messages to agents after initialization
- 🔄 **Auto-Retry Logic**: Built-in resilience with exponential backoff
- ⚡ **Modern Tech Stack**: Built with React, TypeScript, and Vite

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0+ or yarn 1.22+
- A running MAS API backend instance

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/mas-ui.git
cd mas-ui
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

4. **Update `.env` with your API endpoint:**
```env
VITE_API_BASE_URL=http://localhost:3000  # Your MAS API server
```

5. **Start the development server:**
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | MAS API server endpoint | - | Yes |
| `VITE_HMR_HOST` | Custom HMR host for development | localhost | No |
| `VITE_HMR_PORT` | Custom HMR port for development | 5173 | No |
| `VITE_API_PROXY_TARGET` | Proxy target for API calls in dev | - | No |

## Building and Deployment

### Production Build

```bash
npm run build
# or
yarn build
```

The optimized production build will be created in the `dist/` directory.

### Deployment Options

MAS-UI can be deployed to various platforms:

- **Static Hosting**: Deploy the `dist/` folder to any static hosting service
- **Vercel**: See [docs/deployment/vercel.md](docs/deployment/vercel.md)
- **Cloudflare Workers**: See [docs/deployment/cloudflare.md](docs/deployment/cloudflare.md)
- **Nginx/Apache**: See example configurations in [docs/deployment/examples/](docs/deployment/examples/)

For detailed deployment instructions, check the [deployment documentation](docs/deployment/).

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

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run type-check` | Run TypeScript type checking |

### Project Structure

```
mas-ui/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and utility services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main application component
├── public/              # Static assets
├── docs/                # Documentation
│   └── deployment/      # Deployment guides
└── package.json         # Project configuration
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style guidelines
- Submitting pull requests
- Reporting issues

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/yourusername/mas-ui/issues)
- 💬 [Discussions](https://github.com/yourusername/mas-ui/discussions)

## License

MIT License - see [LICENSE](LICENSE) for details