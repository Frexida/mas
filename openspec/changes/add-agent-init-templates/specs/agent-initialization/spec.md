## ADDED Requirements

### Requirement: Template Message System
The system SHALL provide predefined template messages for agent initialization based on their role (meta-manager, manager, or worker).

#### Scenario: Manager template selection
- **GIVEN** a user is configuring a manager agent
- **WHEN** they select the template option
- **THEN** the prompt field is populated with a manager-specific template including coordination instructions

#### Scenario: Worker template selection
- **GIVEN** a user is configuring a worker agent
- **WHEN** they select the template option
- **THEN** the prompt field is populated with a worker-specific template including task execution instructions

#### Scenario: Meta-manager template selection
- **GIVEN** a user is configuring a meta-manager agent (2+ units)
- **WHEN** they select the template option
- **THEN** the prompt field is populated with a meta-manager template for multi-unit coordination

### Requirement: MAS Help Command Integration
The system SHALL automatically append `mas help` command execution to all template messages to ensure agents learn available MAS commands.

#### Scenario: Help command appended to template
- **GIVEN** a user applies any role template
- **WHEN** the template is inserted into the prompt field
- **THEN** the template includes instructions to execute `mas help` and understand the command output

#### Scenario: Custom prompt with help command option
- **GIVEN** a user writes a custom prompt
- **WHEN** they toggle the "Include MAS help" option
- **THEN** the system appends help command instructions to their custom prompt

### Requirement: Template Customization
The system SHALL allow users to customize template messages while preserving the core role instructions.

#### Scenario: Edit template after selection
- **GIVEN** a template has been applied to an agent prompt
- **WHEN** the user modifies the template text
- **THEN** the changes are preserved and used for that agent

#### Scenario: Reset to default template
- **GIVEN** a user has modified a template
- **WHEN** they click "Reset to Default"
- **THEN** the prompt reverts to the original template for that role

### Requirement: Template Persistence
The system SHALL store user template preferences in browser local storage for future sessions.

#### Scenario: Save custom templates
- **GIVEN** a user has customized templates for their agents
- **WHEN** they complete the configuration
- **THEN** their custom templates are saved to local storage

#### Scenario: Load saved templates
- **GIVEN** a user has previously saved custom templates
- **WHEN** they start a new configuration session
- **THEN** the system offers to use their saved templates

### Requirement: Japanese Language Support
The system SHALL provide template messages in Japanese as requested by the user.

#### Scenario: Japanese manager template
- **GIVEN** the interface language is set to Japanese
- **WHEN** a manager template is applied
- **THEN** the template text includes Japanese instructions like "あなたはマネージャーとして意見を統合してください"

#### Scenario: Japanese worker template
- **GIVEN** the interface language is set to Japanese
- **WHEN** a worker template is applied
- **THEN** the template text includes Japanese instructions like "指示に従って、報告してください"