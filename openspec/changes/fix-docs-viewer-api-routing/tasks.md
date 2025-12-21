# Tasks

## Implementation Tasks

- [x] **Update Vite configuration to support VITE_API_BASE**
   - Modify `web/vite.config.ts` to use `VITE_API_BASE` as fallback for proxy target
   - Maintain backward compatibility with `VITE_API_PROXY_TARGET`

- [x] **Fix API port in environment configuration**
   - Update `web/.env.local` to use correct API port (8765)
   - Change from `VITE_API_BASE=http://localhost:3007` to `VITE_API_BASE=http://localhost:8765`

- [x] **Verify proxy configuration**
   - Test that `/api/docs/structure` correctly proxies to backend
   - Ensure proxy rewrites `/api/*` to `/*` for backend routing

## Validation Tasks

- [x] **Test documentation viewer functionality**
   - Start both API server and web dev server
   - Navigate to `/docs` page
   - Verify structure loads without JSON parsing errors
   - Test selecting agents and viewing documents

- [x] **Regression testing**
   - Verify other API endpoints still work (sessions, messages, etc.)
   - Ensure no impact to existing functionality

## Documentation Tasks

- [x] **Update environment configuration documentation**
   - Document the supported environment variables
   - Add example `.env` file if not present