# Fix Docs Viewer API Routing

## Summary

Fix the documentation viewer component which is failing to load documentation due to incorrect API routing configuration. The frontend is requesting `/api/docs/*` but receiving HTML instead of JSON because the proxy configuration is not properly set up.

## Problem Statement

The documentation viewer at `http://localhost:5173/docs` shows an error:
- `SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON`
- The viewer shows "MAS Documentation" with "Select an agent to view documentation" but no content loads

Root causes:
1. The Vite proxy configuration expects `VITE_API_PROXY_TARGET` but `.env.local` provides `VITE_API_BASE`
2. The API base URL in `.env.local` points to port 3007 but the API server runs on port 8765
3. Without proper proxy configuration, `/api/docs/*` requests return the index.html fallback instead of being proxied to the backend

## Proposed Solution

1. Update the Vite configuration to recognize both `VITE_API_BASE` and `VITE_API_PROXY_TARGET` for flexibility
2. Fix the `.env.local` file to point to the correct API port (8765)
3. Ensure the proxy configuration properly routes `/api/*` requests to the backend server

## User Impact

- Documentation viewer will correctly load and display documentation for agents
- Users will be able to browse OpenSpec documents through the web interface
- No breaking changes to existing functionality

## Implementation Approach

The fix involves minimal configuration changes:
- Update `vite.config.ts` to use `VITE_API_BASE` as fallback for proxy target
- Correct the port number in `.env.local`
- No changes needed to backend API routes or frontend components

## Testing Requirements

- Verify documentation structure loads at `/api/docs/structure`
- Verify agent documents load correctly when selected
- Confirm no regression in other API endpoints