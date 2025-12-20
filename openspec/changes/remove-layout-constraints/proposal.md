# Change: Remove Layout Constraints for Full-Width Desktop UI

## Why
現在のUIは記事閲覧型のレイアウト（max-width制約と中央寄せ）を採用しているが、管理画面として画面全体を有効活用したいというニーズがある。デザインはそのまま維持しつつ、レイアウト制約のみを解除する。

## What Changes
- **Layout Constraints**: Remove max-width (max-w-4xl, max-w-6xl) and auto-margin (mx-auto) constraints
- **Container Structure**: Convert to full-width containers using 100% width
- **Viewport Management**: Implement 100vh height with internal scrolling
- **Side-by-side Layout**: Enable SessionSelector and AgentConfigurator to display side-by-side on desktop
- **Responsive Breakpoints**: Maintain mobile responsiveness while optimizing for desktop-first layout

## Impact
- Affected specs: ui-layout (new capability)
- Affected code: All component files with layout classes (App.tsx, SessionSelector.tsx, AgentConfigurator.tsx, SessionOutputDisplay.tsx, Header.tsx, OutputDisplay.tsx)
- User Experience: Better utilization of screen real estate on desktop devices
- **Note**: Visual design and styling remain unchanged - only layout constraints are modified