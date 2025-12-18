# Implementation Tasks

## Phase 1: Branch Preparation
- [x] Create new branch `feature/monorepo` from `feature/background`
- [x] Fetch latest `frontend` branch
- [x] Create backup tags for both branches

## Phase 2: Initial Merge
- [x] Merge `frontend` branch with `--allow-unrelated-histories`
- [x] Create `web/` directory structure
- [x] Move frontend files to `web/` directory
  - [x] Move src/, public/, index.html
  - [x] Move vite.config.ts, tsconfig files
  - [x] Move package.json to web/package.json
- [x] Remove frontend deployment files (wrangler.toml, _worker.js)

## Phase 3: File Conflict Resolution
- [x] Merge .gitignore files
  - [x] Combine both versions
  - [x] Remove duplicates
  - [x] Organize by sections
- [x] Update root README.md
  - [x] Keep backend content as primary
  - [x] Add frontend section
  - [x] Update installation instructions
- [x] Keep backend LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- [x] Move frontend-specific docs to web/docs/

## Phase 4: Package Configuration
- [x] Create root package.json with workspaces
  - [x] Define workspaces: ["api", "web"]
  - [x] Add unified scripts
  - [x] Add concurrently as devDependency
- [x] Update api/package.json
  - [x] Ensure name is "@mas/api"
  - [x] Keep existing dependencies
- [x] Update web/package.json
  - [x] Set name to "@mas/web"
  - [x] Update API endpoint configuration
- [ ] Create shared TypeScript base config (optional)

## Phase 5: Startup Scripts
- [x] Create scripts/start-dev.js
  - [x] Check/start MAS session
  - [x] Start API server on port 8765
  - [x] Start web dev server on port 5173
  - [x] Handle graceful shutdown
- [x] Create scripts/start-prod.js
  - [x] Build web assets
  - [x] Start API in production mode
  - [ ] Serve static files
- [ ] Update scripts/install.sh for monorepo

## Phase 6: Path Updates
- [x] Update web app API endpoints
  - [x] Set base URL to localhost:8765 for dev
  - [x] Configure environment variables
- [x] Update import paths in moved files
- [x] Fix relative paths in configuration files
- [x] Update documentation references

## Phase 7: Integration Testing
- [x] Test clean installation
  - [x] Clone repository
  - [x] Run npm install
  - [x] Verify all dependencies installed
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
- [x] Update root README.md with:
  - [x] New installation instructions
  - [x] Monorepo structure explanation
  - [x] Development workflow
- [x] Create web/README.md for frontend-specific docs
- [x] Update api/README.md if needed
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
- [x] Single `npm install` sets up everything
- [x] Single `npm start` launches full system
- [x] No manual configuration required
- [x] All existing functionality preserved
- [x] Clean, organized repository structure