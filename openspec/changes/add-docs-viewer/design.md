# Documentation Viewer Design

## Architecture Overview
The documentation viewer follows a clean, layered architecture that integrates with the existing MAS web UI:

```
┌─────────────────────────────────────────┐
│           Web UI (React)                │
├─────────────────────────────────────────┤
│  SessionView  │  DocumentViewer (New)   │
├───────────────┴─────────────────────────┤
│           API Client Layer              │
├─────────────────────────────────────────┤
│         Hono API Server                 │
├─────────────────────────────────────────┤
│  Sessions API │  Docs API (New)         │
├───────────────┴─────────────────────────┤
│         File System (unit/*)            │
└─────────────────────────────────────────┘
```

## Component Design

### 1. API Layer (`/api/routes/docs.ts`)
**Responsibilities:**
- Read OpenSpec documents from file system
- Provide structured unit/agent hierarchy
- Serve individual document content

**Endpoints:**
- `GET /api/docs/structure` - Returns unit/agent hierarchy
- `GET /api/docs/agent/:agentId` - Lists documents for an agent
- `GET /api/docs/agent/:agentId/file/*` - Returns specific document content

**Data Flow:**
1. Read from `unit/XX/openspec/` directories
2. Parse directory structure recursively
3. Filter for markdown files
4. Return JSON responses with proper error handling

### 2. UI Components

#### DocumentViewer Page (`/web/src/pages/DocumentViewer.tsx`)
**Purpose:** Main container for the documentation viewing experience

**Layout:**
```
+----------------------------------+
| ← Back | MAS Documentation       |
+----------------------------------+
| TreeView    │  DocumentContent   |
| (300px)     │  (flex: 1)         |
+----------------------------------+
```

#### TreeView Component (`/web/src/components/docs/TreeView.tsx`)
**Purpose:** Hierarchical navigation of units and agents

**Features:**
- Expandable/collapsible unit groups
- Active agent highlighting
- Click to select agent
- Minimal visual design (no icons, pure text)

**State Management:**
```typescript
interface TreeViewState {
  expandedUnits: Set<string>;
  selectedAgent: string | null;
}
```

#### DocumentContent Component (`/web/src/components/docs/DocumentContent.tsx`)
**Purpose:** Display document list and render selected markdown

**Features:**
- File browser for selected agent
- Markdown rendering with react-markdown
- Empty states for no documents
- Error handling for missing files

## Navigation Flow

```
SessionOutputDisplay
    │
    ├─[View Docs]──→ DocumentViewer
    │                      │
    │                      ├─ TreeView (select agent)
    │                      │
    │                      └─ DocumentContent (view files)
    │
    └─[← Back]────────────┘
```

## Styling Approach

### Design Principles
1. **Minimal**: No decorative elements, focus on content
2. **Functional**: Clear visual hierarchy through spacing and borders
3. **Consistent**: Use existing Tailwind classes from the project
4. **Readable**: Adequate line height and contrast

### Color Palette
```css
- Background: white (#ffffff)
- Text: black (#000000)
- Borders: gray-200 (#e5e5e5)
- Hover: gray-50 (#fafafa)
- Selected: gray-100 (#f5f5f5)
```

### Layout Rules
- Fixed sidebar width: 300px
- Content padding: 16px
- Tree indentation: 20px per level
- Border width: 1px
- No rounded corners (sharp edges for clarity)

## State Management

### URL Structure
```
/docs                     # Document viewer (from session context)
```

### Component State
```typescript
interface DocumentViewerState {
  units: UnitStructure;
  selectedAgent: string | null;
  documents: DocumentFile[];
  selectedDocument: string | null;
  documentContent: string | null;
  loading: boolean;
  error: string | null;
}
```

## Error Handling

### API Errors
- 404: Agent or document not found → Show "No documents found"
- 500: Server error → Show error message with retry option
- Network error → Show connection error

### UI Errors
- Empty directories → Show "No OpenSpec documents yet"
- Invalid markdown → Render as plain text
- Missing agent → Default to first available agent

## Performance Considerations

1. **Lazy Loading**: Load documents only when selected
2. **Caching**: Cache document structure for session duration
3. **Debouncing**: Debounce navigation clicks to prevent rapid API calls
4. **Code Splitting**: Document viewer loaded as separate chunk

## Future Enhancements (Not in current scope)
- Full-text search across documents
- Document history/versions
- Export to PDF
- Syntax highlighting for code blocks
- Table of contents for long documents
- Breadcrumb navigation
- Keyboard shortcuts

## Testing Strategy

### Unit Tests
- API endpoint response validation
- Tree view expand/collapse logic
- Document parsing and filtering

### Integration Tests
- Navigation flow from session to docs
- Document loading and rendering
- Error state handling

### Manual Testing
- All 13 agents have accessible documents
- Large documents render properly
- Navigation remains responsive
- Back button preserves session context