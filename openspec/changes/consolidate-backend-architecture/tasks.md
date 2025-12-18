# Implementation Tasks

## Phase 1: Documentation
- [x] Create comprehensive API documentation in `api/README.md`
- [x] Document each API endpoint with request/response examples
- [x] Create architecture diagram in `docs/ARCHITECTURE.md`
- [x] Document shell script modules in `docs/SHELL_MODULES.md`
- [x] Update main README.md with current architecture

## Phase 2: Update References
- [x] Update install.sh to reference mas-core.sh (was mas_refactored.sh)
- [x] Update init_unit.sh documentation references
- [x] Verify send_message.sh is not actively used (still used but can be replaced with mas send)
- [x] Test installation process with updated install.sh

## Phase 3: File Cleanup
- [ ] Remove Apache-related files (apache-proxy.conf, deploy-to-apache.sh, mas-api.service, fix-permissions.sh)
- [ ] Remove old API documentation (api-docs.html, api-redoc.html, openapi.yaml*)
- [ ] Remove CI/CD files (buildspec.yml, CI_CD_GUIDE.md)
- [ ] Remove old implementations (mas.sh after install.sh update, mas.sh.backup)
- [ ] Remove send_message.sh (after verification)
- [ ] Remove http_server_fixed.js
- [ ] Remove outdated documentation (HTTP_SERVER_SETUP.md, ISOLATED_SESSIONS.md)
- [ ] Move serve_docs.py to archive or remove

## Phase 4: OSS Naming Standardization
- [x] Rename mas_refactored.sh to mas-core.sh
- [x] Rename lib modules with mas- prefix (mas-agent.sh, mas-message.sh, etc.)
- [x] Create scripts/ directory and move install.sh, init_unit.sh
- [x] Update all references to renamed files
- [x] Update environment variable names to use MAS_ prefix consistently

## Phase 5: Directory Organization
- [x] Create `docs/` directory
- [x] Move existing documentation to `docs/`
- [x] Create `examples/` directory with usage examples
- [x] Create `tests/` directory structure
- [x] Ensure `.gitignore` excludes temporary files (.mas_*, *.log, *.pid)
- [x] Update file references in remaining scripts

## Phase 6: API Specification
- [x] Document message API contract
- [x] Document session management endpoints
- [x] Create API usage examples
- [x] Document error responses and status codes

## Phase 7: OSS Documentation
- [x] Create LICENSE file (MIT or Apache 2.0)
- [x] Create CONTRIBUTING.md with contribution guidelines
- [x] Create CODE_OF_CONDUCT.md
- [x] Update README.md with badges, installation, usage
- [x] Create CHANGELOG.md
- [x] Add examples/ directory with sample configurations

## Phase 8: Validation
- [x] Test all API endpoints work correctly
- [x] Verify mas send command functions properly
- [x] Ensure WebUI integration still works
- [x] Confirm no broken references to deleted files
- [x] Run full system test with multiple sessions

## Dependencies
- No external dependencies
- All tasks can be done in sequence
- Phase 1 should complete before Phase 2 to ensure documentation exists

## Validation Criteria
- [x] API server starts without errors
- [x] All endpoints respond correctly
- [x] Shell scripts execute without missing dependencies
- [x] Documentation is complete and accurate
- [ ] No legacy files remain in working directory (Phase 3 cleanup still pending)