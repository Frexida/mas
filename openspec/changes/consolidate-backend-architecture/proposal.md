# Consolidate Backend Architecture

## Summary
Consolidate the MAS backend architecture by cleaning up legacy files, documenting the current API implementation, establishing a clear separation between the shell script layer and the API server layer, and adopting professional OSS naming conventions.

## Problem
- Multiple legacy files from previous implementations (Apache configs, OpenAPI specs, CI/CD configs)
- Lack of comprehensive documentation for the current Hono API implementation
- Unclear relationship between shell scripts and API server
- Redundant and obsolete files cluttering the project structure
- Inconsistent naming conventions not suitable for OSS release
- Missing standard OSS documentation (LICENSE, CONTRIBUTING, etc.)

## Solution
1. Remove all legacy and unused files
2. Create comprehensive API documentation
3. Document the layered messaging architecture
4. Establish clear boundaries between components
5. Organize remaining files into appropriate directories
6. Adopt consistent OSS naming conventions (mas- prefix, MAS_ env vars)
7. Add standard OSS documentation (LICENSE, CONTRIBUTING, etc.)
8. Restructure for professional OSS release

## Outcomes
- Clean, organized project structure suitable for OSS release
- Comprehensive API documentation
- Clear understanding of system architecture
- Professional naming conventions throughout
- Standard OSS documentation and structure
- Ready for public release and community contributions
- Ready for feature/background branch merge to main

## Risks
- None - this is primarily cleanup and documentation work

## Alternatives Considered
- Keep legacy files for historical reference: Rejected - they add confusion and are in git history if needed
- Minimal documentation: Rejected - proper documentation is essential for maintainability