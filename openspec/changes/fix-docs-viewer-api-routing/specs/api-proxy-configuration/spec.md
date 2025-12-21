# API Proxy Configuration

## MODIFIED Requirements

### Vite Proxy Configuration

The Vite development server proxy configuration MUST support multiple environment variable names for API target configuration.

#### Scenario: Using VITE_API_BASE environment variable

Given the environment variable `VITE_API_BASE=http://localhost:8765`
When the Vite dev server starts
Then the proxy configuration should route `/api/*` requests to `http://localhost:8765/*`

#### Scenario: Using VITE_API_PROXY_TARGET environment variable

Given the environment variable `VITE_API_PROXY_TARGET=http://localhost:8765`
When the Vite dev server starts
Then the proxy configuration should route `/api/*` requests to `http://localhost:8765/*`

#### Scenario: Priority when both variables are set

Given both `VITE_API_PROXY_TARGET` and `VITE_API_BASE` are set
When the Vite dev server starts
Then `VITE_API_PROXY_TARGET` should take precedence over `VITE_API_BASE`

### Environment Configuration

The web application environment configuration MUST correctly specify the API server location.

#### Scenario: Default API server port

Given the MAS API server runs on port 8765 by default
When configuring the web application environment
Then the `VITE_API_BASE` should be set to `http://localhost:8765`

#### Scenario: API request routing

Given the frontend makes a request to `/api/docs/structure`
And the proxy is configured with target `http://localhost:8765`
When the request is proxied
Then it should be rewritten to `http://localhost:8765/docs/structure`
And the response should be JSON, not HTML