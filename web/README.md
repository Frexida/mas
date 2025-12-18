# MAS Web Interface

React-based web interface for the Multi-Agent System (MAS).

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Local Development

```bash
# Install dependencies (from root directory)
npm install

# Start development server (from root)
npm start

# Or start only the web dev server (from web/)
npm run dev
```

The development server runs on `http://localhost:5173` with hot module replacement.

### Environment Variables

Create a `.env.local` file in the web directory:

```env
# API endpoint (defaults to http://localhost:8765)
VITE_API_BASE_URL=http://localhost:8765
```

## Architecture

### Key Components

- **AgentConfigurator**: Main configuration interface for setting up agent units
- **SessionManager**: Manages active MAS sessions and real-time updates
- **MessageInterface**: Send messages to running agents
- **TemplateSystem**: Pre-configured templates for common agent setups

### API Integration

The web interface communicates with the MAS API server on port 8765:

- `/runs` - Create and manage MAS sessions
- `/message` - Send messages to agents
- `/sessions` - List and monitor active sessions
- `/status` - Check system status

### State Management

- Uses React's built-in state management with Context API
- Local storage for persisting user preferences
- Real-time updates via polling (WebSocket support planned)

## Building for Production

```bash
# Build production assets (from root)
npm run build:web

# Or from web directory
npm run build
```

Build output is in `web/dist/` and can be served by any static web server or the MAS API in production mode.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form management

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for general guidelines.

### Frontend-Specific Guidelines

1. Follow the existing component structure
2. Use TypeScript for all new code
3. Add proper type definitions
4. Follow the established styling patterns with Tailwind
5. Test across different browsers
6. Ensure accessibility standards are met

## License

MIT - See [LICENSE](../LICENSE) for details.