# Archived Branches

## 2025-12-19 - Main Branch Established

The following branches were archived after establishing the main branch:

### Feature/Monorepo Branch
- **Original**: `feature/monorepo`
- **Status**: Fully merged into `main`
- **Description**: Complete monorepo implementation with npm package support
- **Key Features**:
  - Monorepo structure with api/ and web/ workspaces
  - npm package published as @frexida/mas v2.2.0
  - --dev mode for integrated development environment
- **Last Commit**: 4f4726e - feat: add --dev mode for integrated development environment

### Local Development Branches
- **init-agents**: Agent initialization features (deleted locally, merged to master)
- **mas-unit**: Unit-based architecture (deleted locally, merged to master)
- **multi-units**: Multi-unit support (deleted locally, merged to master)

## 2024-12-18 - Monorepo Migration

The following branches were archived after the monorepo migration:

### Frontend Branch
- **Original**: `frontend`
- **Archive Tag**: `archive/frontend-20241218`
- **Description**: Original frontend React application
- **Merged Into**: `feature/monorepo`
- **Last Commit**: Contains full MAS-UI WebUI implementation

### Feature/Background Branch
- **Original**: `feature/background`
- **Archive Tag**: `archive/feature-background-20241218`
- **Description**: Backend API implementation with Hono framework
- **Merged Into**: `feature/monorepo`
- **Last Commit**: f340054 - Complete backend with session management

### Feature/HTTP-API Branch
- **Original**: `feature/http-api`
- **Archive Tag**: `archive/feature-http-api-20241218`
- **Description**: Early HTTP API experiments
- **Status**: Superseded by monorepo structure
- **Last Commit**: 4d394f6

### Feature/MAS-UI Branch
- **Original**: `feature/mas-ui`
- **Archive Tag**: `archive/feature-mas-ui-20241218`
- **Description**: UI experiments and early WebUI development
- **Status**: Superseded by monorepo structure
- **Last Commit**: 30387cd

## Recovery Instructions

To recover any archived branch:
```bash
# Checkout from tag
git checkout -b recovered-branch-name archive/tag-name

# Example: Recover frontend branch
git checkout -b recovered-frontend archive/frontend-20241218
```

## Archive Strategy

All feature branches that were merged into the monorepo structure have been:
1. Tagged with `archive/` prefix and date stamp
2. Pushed to origin as tags for permanent storage
3. Deleted from active branch list to keep repository clean

This ensures complete history preservation while maintaining a clean working environment.