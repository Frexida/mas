# Design Document: Full-Width Layout Implementation

## Context
The current web UI uses a content-centric layout with max-width constraints (max-w-4xl, max-w-6xl) and auto-centering (mx-auto), suitable for article/blog-style interfaces. However, for a management dashboard interface, utilizing the full screen real estate is more appropriate for productivity and information density.

## Goals / Non-Goals

### Goals:
- Remove all max-width constraints to utilize full viewport width
- Implement 100vh height with proper internal scrolling
- Create side-by-side layout for SessionSelector and configuration panels
- Maintain the existing visual design and styling
- Preserve mobile responsiveness

### Non-Goals:
- Change the visual design or color scheme
- Modify component functionality
- Alter the existing navigation flow
- Add new features or capabilities

## Decisions

### Decision: CSS-Only Implementation
Use Tailwind CSS class modifications without changing component logic.
- **Rationale**: Minimizes risk and complexity while achieving the desired layout changes
- **Alternatives considered**:
  - Custom CSS framework: Rejected due to unnecessary complexity
  - Component restructuring: Rejected as it would require more extensive changes

### Decision: Flexbox-Based Layout System
Use flexbox for the main container structure to enable side-by-side layout.
- **Rationale**: Flexbox provides reliable and responsive layout control
- **Alternatives considered**:
  - CSS Grid: More complex than needed for two-panel layout
  - Float-based layout: Outdated and less flexible

### Decision: Component-Level Scrolling
Each major component manages its own scroll container rather than page-level scrolling.
- **Rationale**: Better control over scroll behavior and prevents nested scrollbar issues
- **Implementation**: Use `overflow-y-auto` on component containers with fixed heights

## Layout Structure

### Desktop Layout (>=1024px):
```
┌─────────────────────────────────────────┐
│                Header                    │ <- Full width, fixed
├─────────────────────────────────────────┤
│         │                                │
│ Session │    Configuration/             │ <- 100vh - header
│ List    │    Output Display             │    with internal scroll
│ (30-40%)│    (60-70% flex)             │
│         │                                │
└─────────────────────────────────────────┘
```

### Mobile Layout (<1024px):
```
┌──────────────┐
│    Header    │
├──────────────┤
│              │
│   Content    │ <- Stacked vertically
│  (scrollable)│
│              │
└──────────────┘
```

## CSS Class Mappings

### Containers to Update:
| Current | New |
|---------|-----|
| `max-w-4xl mx-auto` | `w-full` |
| `max-w-6xl mx-auto` | `w-full` |
| `max-w-7xl mx-auto` | `w-full` |
| Container divs | Add `px-4 sm:px-6 lg:px-8` for consistent padding |

### Height Management:
- App root: `h-screen flex flex-col`
- Header: `flex-shrink-0`
- Main content: `flex-grow overflow-hidden`
- Panels: `h-full overflow-y-auto`

## Risks / Trade-offs

### Risk: Content Readability on Ultra-wide Displays
- **Mitigation**: Maintain appropriate padding and consider max-width for text content blocks only
- **Trade-off**: Prioritize screen utilization over reading comfort for management interface

### Risk: Scroll Behavior Complexity
- **Mitigation**: Test thoroughly on different viewport sizes and ensure no double scrollbars
- **Trade-off**: Component-level scrolling adds complexity but provides better control

### Risk: Breaking Mobile Layout
- **Mitigation**: Use responsive classes (lg:flex-row) to maintain mobile-first approach
- **Trade-off**: Desktop optimization while preserving mobile functionality

## Migration Plan
1. Create feature branch from current branch
2. Apply CSS class changes component by component
3. Test each component individually
4. Test integrated layout behavior
5. Verify responsive breakpoints
6. No database migration or API changes required

## Open Questions
- Should the side-by-side split ratio be adjustable by users?
  - **Decision**: Fixed ratio for initial implementation, can add resizable panels later
- Should we preserve any max-width for specific content types (e.g., text paragraphs)?
  - **Decision**: Remove all constraints initially, can selectively add back if needed