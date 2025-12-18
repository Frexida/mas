## 1. Template System Foundation
- [x] 1.1 Create `src/utils/templates.ts` with role-based template definitions
- [x] 1.2 Define template types in `src/types/templates.ts` (TemplateRole, TemplateConfig, etc.)
- [x] 1.3 Implement template storage service in `src/services/templateStorage.ts`

## 2. Template Content Creation
- [x] 2.1 Write Japanese manager template with coordination instructions
- [x] 2.2 Write Japanese worker template with execution and reporting instructions
- [x] 2.3 Write Japanese meta-manager template for multi-unit coordination
- [x] 2.4 Add MAS help command instructions to all templates
- [x] 2.5 Create English versions of all templates for internationalization

## 3. UI Components for Templates
- [x] 3.1 Create `TemplateSelector.tsx` component with dropdown for template selection
- [x] 3.2 Add "Use Template" button to `PromptInput.tsx` component
- [x] 3.3 Create `TemplatePreview.tsx` modal for viewing full template before applying
- [x] 3.4 Add "Reset to Default" button for reverting customized templates
- [ ] 3.5 Create "Include MAS Help" checkbox for custom prompts

## 4. Integration with Configuration Hook
- [x] 4.1 Add template actions to `useMasConfiguration` reducer (APPLY_TEMPLATE, RESET_TEMPLATE)
- [x] 4.2 Implement `applyTemplate` function in the hook
- [x] 4.3 Add template state management (current templates, customizations)
- [x] 4.4 Integrate template persistence with localStorage

## 5. Template Customization Features
- [x] 5.1 Implement editable template fields with change tracking
- [ ] 5.2 Add template validation (ensure help command remains, character limits)
- [ ] 5.3 Create template diff viewer to show changes from default
- [x] 5.4 Implement template export/import functionality

## 6. Testing and Validation
- [ ] 6.1 Write unit tests for template utilities
- [x] 6.2 Test template application across all agent roles
- [x] 6.3 Verify localStorage persistence works correctly
- [x] 6.4 Test Japanese character rendering and display
- [x] 6.5 Validate help command integration in all templates

## 7. Documentation and Examples
- [x] 7.1 Add template usage section to README
- [ ] 7.2 Create example configurations with templates
- [ ] 7.3 Document template customization guidelines
- [ ] 7.4 Add inline help text in UI components