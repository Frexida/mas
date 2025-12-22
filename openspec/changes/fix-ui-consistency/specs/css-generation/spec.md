# CSS Generation Specification

## ADDED Requirements

### Requirement: Deterministic CSS Output
The CSS generation process MUST produce identical output for the same input regardless of environment.

#### Scenario: Consistent utility generation
Given the same Tailwind configuration and source files
When generating CSS in different environments
Then the output CSS files are functionally identical

#### Scenario: Predictable purging behavior
Given a defined content path configuration
When Tailwind scans for used classes
Then the same utilities are detected and preserved

### Requirement: Safelist Management
Critical layout utilities MUST be explicitly safelisted to prevent removal.

#### Scenario: Core layout utilities preserved
Given a safelist containing w-full, flex, flex-row
When production CSS is generated
Then these utilities are always included regardless of detection

#### Scenario: Component-specific utilities protected
Given utilities used dynamically or conditionally
When added to the safelist
Then they survive the purging process

## MODIFIED Requirements

### Requirement: Tailwind Content Configuration
The Tailwind content paths MUST accurately reflect all template locations.

#### Scenario: Complete file coverage
Given content paths including './src/**/*.{tsx,jsx,ts,js}'
When Tailwind scans for utilities
Then all component files are analyzed for class usage

#### Scenario: Index.html inclusion
Given the root index.html file
When configured in content paths
Then utilities in the HTML template are preserved