# Implementation Tasks

## Phase 1: Branch Preparation
- [ ] Create new branch `feature/monorepo` from `feature/background`
- [ ] Fetch latest `frontend` branch
- [ ] Create backup tags for both branches

## Phase 2: Initial Merge
- [ ] Merge `frontend` branch with `--allow-unrelated-histories`
- [ ] Create `web/` directory structure
- [ ] Move frontend files to `web/` directory
  - [ ] Move src/, public/, index.html
  - [ ] Move vite.config.ts, tsconfig files
  - [ ] Move package.json to web/package.json
- [ ] Remove frontend deployment files (wrangler.toml, _worker.js)

## Phase 3: File Conflict Resolution
- [ ] Merge .gitignore files
  - [ ] Combine both versions
  - [ ] Remove duplicates
  - [ ] Organize by sections
- [ ] Update root README.md
  - [ ] Keep backend content as primary
  - [ ] Add frontend section
  - [ ] Update installation instructions
- [ ] Keep backend LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- [ ] Move frontend-specific docs to web/docs/

## Phase 4: Package Configuration
- [ ] Create root package.json with workspaces
  - [ ] Define workspaces: ["api", "web"]
  - [ ] Add unified scripts
  - [ ] Add concurrently as devDependency
- [ ] Update api/package.json
  - [ ] Ensure name is "@mas/api"
  - [ ] Keep existing dependencies
- [ ] Update web/package.json
  - [ ] Set name to "@mas/web"
  - [ ] Update API endpoint configuration
- [ ] Create shared TypeScript base config (optional)

## Phase 5: Startup Scripts
- [ ] Create scripts/start-dev.js
  - [ ] Check/start MAS session
  - [ ] Start API server on port 8765
  - [ ] Start web dev server on port 5173
  - [ ] Handle graceful shutdown
- [ ] Create scripts/start-prod.js
  - [ ] Build web assets
  - [ ] Start API in production mode
  - [ ] Serve static files
- [ ] Update scripts/install.sh for monorepo

## Phase 6: Path Updates
- [ ] Update web app API endpoints
  - [ ] Set base URL to localhost:8765 for dev
  - [ ] Configure environment variables
- [ ] Update import paths in moved files
- [ ] Fix relative paths in configuration files
- [ ] Update documentation references

## Phase 7: Integration Testing
- [ ] Test clean installation
  - [ ] Clone repository
  - [ ] Run npm install
  - [ ] Verify all dependencies installed
- [ ] Test startup sequence
  - [ ] Run npm start
  - [ ] Verify MAS session starts
  - [ ] Verify API starts on 8765
  - [ ] Verify web starts on 5173
- [ ] Test API-Frontend communication
  - [ ] Test message sending
  - [ ] Test session management
  - [ ] Test real-time updates
- [ ] Test production build
  - [ ] Run npm run build
  - [ ] Test production startup

## Phase 8: Documentation
- [ ] Update root README.md with:
  - [ ] New installation instructions
  - [ ] Monorepo structure explanation
  - [ ] Development workflow
- [ ] Create web/README.md for frontend-specific docs
- [ ] Update api/README.md if needed
- [ ] Create CHANGELOG entry
- [ ] Update examples/ with full-stack examples

## Phase 9: Cleanup
- [ ] Remove obsolete files
- [ ] Clean up duplicate configurations
- [ ] Verify .gitignore coverage
- [ ] Run linter/formatter

## Phase 10: Validation & Release
- [ ] Create comprehensive test checklist
- [ ] Test on fresh environment
- [ ] Update version to 0.2.0
- [ ] Create pull request
- [ ] Tag release after merge

## Dependencies
- Phase 2 depends on Phase 1
- Phase 3-4 can be done in parallel after Phase 2
- Phase 5-6 depend on Phase 4
- Phase 7 depends on Phase 5-6
- Phase 8 can start after Phase 3
- Phase 9-10 depend on all previous phases

## Success Criteria
- [ ] Single `npm install` sets up everything
- [ ] Single `npm start` launches full system
- [ ] No manual configuration required
- [ ] All existing functionality preserved
- [ ] Clean, organized repository structure