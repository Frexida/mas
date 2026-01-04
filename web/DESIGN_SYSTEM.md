# MAS Design System

> 読むだけなら優しく、踏み込むなら覚悟が要るUI

## Core Philosophy

MAS UI is a **general-purpose interface with industrial internals**. It looks approachable, but respects the weight of its operations.

**Three principles:**

1. **Readability over decoration** - Information is meant to be read, not glanced at
2. **Layer separation** - Casual users see essentials; power users reveal details
3. **Color has meaning** - Every color signals a specific function

---

## Color System

Colors are not equal. They have a strict hierarchy.

### Hierarchy

| Color | Ratio | Role |
|-------|-------|------|
| **Grayscale** | 85-90% | Reading, thinking, stability |
| **Blue** | 8-12% | Operating, navigation |
| **Purple** | 1-3% | Boundaries, commitment |

Exceeding these ratios causes:
- Visual fatigue
- Loss of meaning
- Unprofessional appearance

### Grayscale (Base Layer)

**Purpose:** Enable judgment without distraction

**Usage:**
- Backgrounds
- Body text
- Tables
- Logs
- Default states

**Tokens (Tailwind classes):**
```css
/* Background */
bg-mas-bg-root      /* #0f1117 - Main background */
bg-mas-bg-panel     /* #161a23 - Cards, panels */
bg-mas-bg-subtle    /* #1c2130 - Hover, selection */

/* Borders */
border-mas-border         /* #2a2f3a - Default */
border-mas-border-strong  /* #3a4152 - Emphasis */

/* Text */
text-mas-text            /* #e6e8ee - Primary */
text-mas-text-secondary  /* #9aa1b2 - Secondary */
text-mas-text-muted      /* #6f7687 - Muted */
```

**Rule:** Grayscale is not "no personality" - it is "space for thinking."

### Blue (Primary Accent)

**Purpose:** Mark safe, interactive elements

**Meaning:** Trust, control, safety = "You can touch this safely"

**Usage:**
- Primary buttons
- Selected menu items
- Active states
- Links
- Focus rings
- Row hover

**Tokens (Tailwind classes):**
```css
bg-mas-blue       /* #4ea1ff - Primary action */
bg-mas-blue-soft  /* #2f6fb2 - Hover, focus */
bg-mas-blue-muted /* #1f3f66 - Selection background */

text-mas-blue
border-mas-blue
ring-mas-blue
```

**Rule:** Blue is always-OK, but don't overuse.

### Purple (Secondary Accent)

**Purpose:** Signal weight, boundaries, commitment

**Meaning:** Irreversible, autonomous, crossing = "Commitment required"

**Usage is strictly limited to:**

#### 1. Heavy Operations
- Override / Force stop
- Delete permanently
- Bypass safeguards

#### 2. Special States
- Autonomous mode
- Self-modifying behavior
- Experimental features

#### 3. Boundary Crossings
- About / Vision pages
- "Why this exists" links
- Philosophy documentation

**Tokens (Tailwind classes):**
```css
bg-mas-purple      /* #7b6cff - Accent */
bg-mas-purple-soft /* #4b3f8f - Hover, line */
bg-mas-purple-dim  /* #2a254a - Subtle background */

text-mas-purple
border-mas-purple
```

**Rule:** Purple = "Commitment required."

### Status Colors (Minimal)

```css
text-mas-status-ok       /* #6fcf97 - Active */
text-mas-status-warning  /* #f2c94c - Warning */
text-mas-status-error    /* #eb5757 - Error */
text-mas-status-off      /* #6f7687 - Inactive */
```

**Rule:** Status colors are functional only. Don't mix with purple.

**Forbidden uses:**
- Navigation base color
- Normal buttons
- Always-visible elements
- Decorative purposes

---

## Layer Separation

UI has two layers. Not modes - structural hierarchy.

### Layer 1: General User (Default)

**Purpose:** Understand state, feel safe

**Rules:**
- Sentence case
- No technical jargon
- Hide IDs, paths, internal states
- Minimal numbers

**Example:**
```
Session name
Status: Active
Agents running
Last updated 2 days ago

[View details]
```

### Layer 2: Power User (On Demand)

**Purpose:** Debug, trace, recover

**Rules:**
- Revealed via fold/details/hover
- Monospace font
- Technical labels OK (uppercase for labels only)
- No color (grayscale)

**Example (expanded):**
```
Internal details
────────────────────────────────
Session ID    c053ed80-0720-4ab0-8e68-b946d4013aed
Path          /home/.../sessions/mas-c053ed80
State         idle
Agent count   6
```

### Implementation Patterns

**Fold (recommended):**
```html
<details>
  <summary>View technical details</summary>
  <!-- Layer 2 content -->
</details>
```

**Hover (supplementary):**
```
Session name        Active
                    ↳ Hover: "ID: c053ed80..."
```

**Rule:** Layer separation is structural, not color-based.

---

## Typography

### Hierarchy

| Element | Style | Case |
|---------|-------|------|
| Page title | Sans, bold, large | Sentence case |
| Section header | Sans, semibold | Sentence case |
| Body text | Sans, regular | Sentence case |
| Labels | Sans, medium, small | Sentence case |
| Technical labels | Sans, medium, small | UPPERCASE OK |
| IDs, paths, logs | Monospace | As-is |

### Case Rules

**Sentence case everywhere** except:
- Technical labels in Layer 2 (`SESSION ID`, `PATH`)
- Status badges when technical (`ACTIVE`, `IDLE`)

**Never:**
- ALL CAPS for headings
- ALL CAPS for buttons
- ALL CAPS in body text

---

## Icons

### Philosophy

> Text + rules, not icons + guessing

Icons are **supplementary**, not primary communication.

### Rules

1. **Reduce quantity** - If text works, skip the icon
2. **No decorative icons** - Every icon must have function
3. **Avoid:**
   - Gear icons (implies infinite configurability)
   - Circular/playful icons (too casual for operations)
4. **Prefer:**
   - Arrows for direction
   - Simple shapes for state
   - Nothing over ambiguous icons

### Sizes

- Inline with text: 16px (`w-4 h-4`)
- Standalone: 20px (`w-5 h-5`)

---

## Component Patterns

### Buttons

| Type | Color | Usage |
|------|-------|-------|
| Primary | Blue | Main actions, confirmations |
| Secondary | Outline (grayscale) | Cancel, alternative actions |
| Dangerous | Purple | Override, force, delete |

**Dangerous button rule:** Purple appears on hover only, not at rest.

### Status Badges

Keep minimal. Text + subtle background.

```css
Active      → text-mas-status-ok bg-mas-bg-subtle
Inactive    → text-mas-status-off bg-mas-bg-subtle
Warning     → text-mas-status-warning bg-mas-bg-subtle
Error       → text-mas-status-error bg-mas-bg-subtle
```

**No bright, saturated badges.** They compete with content.

### Tables / Lists

- Row hover: faint blue tint
- Selected: blue left border or background
- No zebra striping (adds visual noise)

### Forms

- Labels above inputs
- Error messages in red (exception to color rules - functional)
- Focus ring: blue

---

## Tone of Voice

### Layer 1 (General)

- Use verbs
- Include subjects
- Lower abstraction

```
View details
This session is inactive
No agents are currently running
```

### Layer 2 (Technical)

- Nouns only
- Technical terms OK
- Zero emotion

```
Internal state
Agent count
Session path
```

---

## Anti-Patterns

**Do not:**

1. Use purple for navigation or headers
2. Add icons to every button
3. Use color to separate layers
4. Show IDs by default
5. Use ALL CAPS for non-technical text
6. Add status colors that compete with content
7. Create "cute" or "friendly" UI elements

**This UI is industrial, not playful.**

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│  Color ratio:  Grayscale 85-90% │ Blue 8-12% │ Purple 1-3%  │
├─────────────────────────────────────────────────────────┤
│  Grayscale = Read, think                                │
│  Blue = Operate, navigate                               │
│  Purple = Commit, cross boundaries                      │
├─────────────────────────────────────────────────────────┤
│  Layer 1 = Friendly surface (default)                   │
│  Layer 2 = Technical depth (on demand)                  │
├─────────────────────────────────────────────────────────┤
│  Icons = Minimal, functional only                       │
│  Text = Sentence case (technical labels excepted)       │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Tailwind Integration

Design tokens are defined in `src/index.css`:

```css
@theme {
  /* Background */
  --color-mas-bg-root: #0f1117;
  --color-mas-bg-panel: #161a23;
  --color-mas-bg-subtle: #1c2130;

  /* Borders */
  --color-mas-border: #2a2f3a;
  --color-mas-border-strong: #3a4152;

  /* Text */
  --color-mas-text: #e6e8ee;
  --color-mas-text-secondary: #9aa1b2;
  --color-mas-text-muted: #6f7687;

  /* Blue (primary accent) */
  --color-mas-blue: #4ea1ff;
  --color-mas-blue-soft: #2f6fb2;
  --color-mas-blue-muted: #1f3f66;

  /* Purple (secondary accent) */
  --color-mas-purple: #7b6cff;
  --color-mas-purple-soft: #4b3f8f;
  --color-mas-purple-dim: #2a254a;

  /* Status */
  --color-mas-status-ok: #6fcf97;
  --color-mas-status-warning: #f2c94c;
  --color-mas-status-error: #eb5757;
  --color-mas-status-off: #6f7687;
}
```

Use as: `bg-mas-bg-root`, `text-mas-blue`, `border-mas-purple`, etc.

---

## Summary

MAS UI identity comes from **order**, not decoration.

- Information arrangement
- Ruthless simplification
- Calm, abstract tone
- Purple appearing **with meaning**

This cannot be replicated by generic UI frameworks.
