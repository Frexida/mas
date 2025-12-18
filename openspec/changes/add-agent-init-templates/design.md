# Design: Agent Initialization Templates

## Context
The MAS UI currently requires users to manually write prompts for each agent (meta-manager, managers, workers). Users want predefined templates in Japanese that establish agent roles and teach them about MAS commands via `mas help`. This feature will significantly reduce setup time and ensure consistent agent behavior across sessions.

## Goals / Non-Goals

### Goals
- Provide role-specific template messages in Japanese
- Automatically include MAS help command learning in templates
- Allow template customization while preserving core instructions
- Store user preferences for future sessions
- Support both Japanese and English languages

### Non-Goals
- Dynamic template generation based on task analysis
- Template sharing between users
- Server-side template storage
- Complex template inheritance or composition
- Runtime template modification after agent creation

## Decisions

### Decision: Client-Side Template Storage
**Choice**: Store templates and customizations in browser localStorage
**Rationale**:
- No backend changes required
- Fast access and modification
- Privacy preserved (templates may contain sensitive instructions)
- Matches existing pattern for API configuration storage

**Alternatives considered**:
- Server storage: Requires API changes, adds complexity
- Session storage: Lost on browser close, poor UX
- IndexedDB: Overkill for simple key-value storage

### Decision: Template Structure
**Choice**: Static templates with variable placeholders
```typescript
interface Template {
  id: string;
  role: 'meta-manager' | 'manager' | 'worker';
  language: 'ja' | 'en';
  content: string;
  variables: {
    unitId?: number;
    agentId?: string;
    helpCommand: string;
  };
}
```

**Rationale**:
- Simple to implement and understand
- Supports internationalization
- Allows for future variable expansion
- Easy to validate and test

### Decision: Help Command Integration
**Choice**: Append help command instructions to all templates as a separate paragraph
**Format**:
```
[Template content...]

初期化時に以下のコマンドを実行してシステムを理解してください：
mas help
このコマンドの出力を読んで、利用可能なコマンドとメッセージの送信方法を学習してください。
```

**Rationale**:
- Clear separation from role instructions
- Easy to identify and update
- Users can remove if not needed
- Consistent across all roles

## Template Content Design

### Manager Template (Japanese)
```
あなたはユニット{unitId}のマネージャーです。チーム内の意見を統合し、効果的な決定を下してください。

責任：
- ワーカーからの報告を収集し分析する
- タスクの優先順位を決定する
- チームの方向性を示す
- 上位マネージャーへの報告を行う

初期化時に以下のコマンドを実行してシステムを理解してください：
mas help
```

### Worker Template (Japanese)
```
あなたはユニット{unitId}のワーカー{workerId}です。マネージャーの指示に従い、タスクを実行して報告してください。

責任：
- 割り当てられたタスクを正確に実行する
- 進捗と結果を定期的に報告する
- 問題や障害を速やかに伝える
- 他のワーカーと協力する

初期化時に以下のコマンドを実行してシステムを理解してください：
mas help
```

### Meta-Manager Template (Japanese)
```
あなたはメタマネージャーです。複数のユニットを統括し、システム全体の調整を行ってください。

責任：
- 各ユニットマネージャーからの報告を統合する
- システム全体の戦略を策定する
- リソースの配分を最適化する
- ユニット間の調整を行う

初期化時に以下のコマンドを実行してシステムを理解してください：
mas help
```

## Component Architecture

### New Components
1. **TemplateSelector**: Dropdown with preview button
2. **TemplatePreview**: Modal showing full template
3. **TemplateCustomizer**: Edit interface with diff view
4. **HelpCommandToggle**: Checkbox for including help

### Modified Components
1. **PromptInput**: Add template button and integration
2. **AgentConfigurator**: Template state management
3. **useMasConfiguration**: Template actions and state

### Service Layer
```typescript
// src/services/templateService.ts
class TemplateService {
  getTemplate(role, language): Template
  applyTemplate(template, variables): string
  saveCustomTemplate(role, content): void
  loadCustomTemplates(): Map<string, Template>
  resetToDefault(role): Template
}
```

## Risks / Trade-offs

### Risk: Template Complexity
Users might find templates too prescriptive or limiting.
**Mitigation**: Make templates fully editable with easy reset option.

### Risk: Language Confusion
Mixing Japanese templates with English UI.
**Mitigation**: Detect browser language and set appropriate defaults.

### Risk: Storage Limits
localStorage has ~5-10MB limit.
**Mitigation**: Templates are text-only, unlikely to exceed limits. Add storage check.

### Trade-off: Static vs Dynamic Templates
**Choice**: Static templates
**Pro**: Simple, predictable, testable
**Con**: Less flexible for complex scenarios
**Justification**: Covers 90% use case, users can customize for edge cases

## Migration Plan

### Phase 1: Core Implementation
1. Implement template system without UI
2. Add basic template selector
3. Test with Japanese templates

### Phase 2: Enhancement
1. Add customization features
2. Implement persistence
3. Add English templates

### Phase 3: Polish
1. Add preview modals
2. Implement diff viewer
3. Add export/import

### Rollback Strategy
- Feature flag: `enableTemplates` in config
- Templates are additive, don't break existing manual prompts
- Can disable via configuration without code changes

## Open Questions

1. **Q**: Should templates be versioned for updates?
   **A**: Consider in v2 if templates evolve significantly

2. **Q**: Should we support template composition (base + role + custom)?
   **A**: Keep simple for v1, evaluate based on usage

3. **Q**: How to handle template updates when MAS commands change?
   **A**: Document in release notes, provide migration guide

## Performance Considerations

- Templates loaded once on app start (< 10KB total)
- localStorage access is synchronous but fast (< 1ms)
- No network requests required
- Template application is simple string replacement (< 1ms)

## Security Considerations

- Templates stored in plaintext localStorage (acceptable for non-sensitive data)
- No user data or credentials in templates
- XSS prevention: Templates rendered as text, not HTML
- Input validation: Character limit (5000) prevents abuse