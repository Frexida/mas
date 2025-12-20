# Implementation Tasks

## Phase 1: API Implementation (Backend)

- [x] Create `/api/routes/docs.ts` with documentation endpoints
- [x] Implement `GET /api/docs/structure` endpoint for unit/agent hierarchy
- [x] Implement `GET /api/docs/agent/:agentId` endpoint for document listing
- [x] Implement `GET /api/docs/agent/:agentId/file/*` endpoint for document content
- [x] Add path traversal protection to file serving endpoints
- [x] Register docs route in `/api/server.ts`
- [x] Test API endpoints with sample agent directories

## Phase 2: UI Components (Frontend)

- [x] Create `/web/src/pages/DocumentViewer.tsx` main container component
- [x] Create `/web/src/components/docs/TreeView.tsx` for unit/agent navigation
- [x] Implement expand/collapse logic for unit groups in TreeView
- [x] Implement agent selection with visual highlighting
- [x] Create `/web/src/components/docs/DocumentContent.tsx` for document display
- [x] Implement document list display with directory structure
- [x] Add markdown rendering using react-markdown
- [x] Implement loading and error states
- [x] Add empty state for agents with no documents

## Phase 3: Navigation Integration

- [x] Add route for `/docs` in main App router configuration
- [x] Add "View Docs" button to SessionOutputDisplay component
- [x] Implement navigation from session view to docs viewer
- [x] Add "← Back" button in DocumentViewer header
- [x] Test navigation flow between session and docs views
- [x] Ensure browser back button works correctly

## Phase 4: Styling and Polish

- [x] Apply minimal styling using Tailwind classes
- [x] Set up responsive layout (desktop: sidebar + content, mobile: stacked)
- [x] Style tree view with proper indentation and borders
- [x] Style markdown content with appropriate typography
- [x] Add hover states for interactive elements
- [x] Ensure consistent spacing and alignment

## Phase 5: Testing and Validation

- [x] Test with all 13 agent directories
- [x] Verify empty directories show appropriate message
- [x] Test large markdown files for performance
- [x] Verify error handling for missing files
- [x] Test on mobile and desktop viewports
- [x] Manual testing of complete user flow
- [x] Fix any bugs discovered during testing

## Phase 6: Documentation

- [ ] Update README with documentation viewer feature
- [ ] Add usage instructions for viewing OpenSpec docs
- [ ] Document API endpoints in API documentation
- [ ] Create screenshots for documentation (optional)

## Dependencies and Parallelization

**Can be done in parallel:**
- Phase 1 (API) and initial Phase 2 (UI component structure)
- Phase 4 (Styling) can begin once Phase 2 components exist

**Must be sequential:**
- Phase 3 requires Phase 2 components to exist
- Phase 5 requires all previous phases complete
- Phase 6 should be done after implementation is stable

## Validation Checklist

- [x] All API endpoints return correct data format
- [x] UI renders properly in Chrome, Firefox, Safari
- [x] No console errors during normal operation
- [x] Error states are handled gracefully
- [x] Performance is acceptable with large documents
- [x] Navigation maintains proper state
- [x] Code follows existing project conventions