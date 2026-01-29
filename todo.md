# Design Team Map - Development Todo

## Project Overview
A web app for planning hiring and growth progression for design teams with an interactive flowchart visualization.

---

## Phase 1: Project Setup
- [x] Initialize React + TypeScript project with Vite
- [x] Install dependencies (React Flow, Zustand, uuid)
- [x] Set up project structure (components, hooks, types, utils)
- [x] Configure base styling (monospace font, dot background, orange accent)

## Phase 2: Core Data Models & State
- [x] Define TypeScript types (TeamMember, PlannedHire, Level, DesignerType, Settings)
- [x] Create Zustand store for app state
- [x] Implement local storage persistence
- [x] Create default settings configuration

## Phase 3: Flow Chart Canvas
- [x] Set up React Flow canvas with dot background
- [x] Create custom node component for team members
- [x] Create custom node component for planned hires (dashed style)
- [x] Implement custom edge component with red warning for >6 reports
- [x] Add drag-drop functionality
- [ ] Implement auto-arrange/layout algorithm
- [x] Add zoom/pan controls

## Phase 4: Node Interactions
- [x] Click node to open side panel with details
- [x] Edit member details (name, type, level, years of experience)
- [x] Add/edit joining date for existing members
- [x] Add/edit tentative date (month/quarter) for planned hires
- [x] Change reporting structure via drag-drop (connect nodes)
- [x] Delete node functionality
- [x] Add new member / planned hire

## Phase 5: Verticals/Teams Management
- [ ] Add verticals directly on canvas
- [ ] Edit vertical names inline
- [ ] Visual grouping of nodes by vertical
- [ ] Drag nodes between verticals

## Phase 6: Settings Panel
- [x] Settings UI (modal)
- [x] Configure number of levels
- [x] Configure level names and colors
- [x] Configure promotion requirements (min years per level transition)
- [x] Configure designer types list
- [x] Configure span of control threshold (default: 6)
- [x] Import/Export data as JSON

## Phase 7: Rules & Validation
- [x] Visual warning when manager has >6 reports (red edge with warning icon)
- [x] Calculate promotion eligibility based on tenure and level config
- [x] Show growth eligibility indicator on nodes (green badge)
- [ ] Succession planning hints (who can grow into which role)

## Phase 8: Export & Polish
- [ ] Export flowchart as PNG
- [ ] Export flowchart as PDF
- [x] Export/Import team data as JSON (backup/restore)
- [ ] Responsive design adjustments
- [ ] Keyboard shortcuts
- [ ] Empty state and onboarding hints

---

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Flow Chart:** React Flow (@xyflow/react)
- **State Management:** Zustand with localStorage persistence
- **Styling:** CSS Modules
- **Storage:** LocalStorage

## Design Specs
- **Font:** JetBrains Mono (monospace)
- **Background:** Dot grid pattern
- **Accent Color:** Orange (#f97316)
- **Style:** Minimal, clean

---

## Current Progress
MVP complete! Core features implemented:
- Flow chart canvas with drag-drop nodes
- Team member and planned hire nodes
- Manager-report relationships with visual warnings for span of control
- Side panel for editing node details
- Settings panel for configuring levels, designer types, and thresholds
- Promotion eligibility tracking
- JSON export/import for backup

### Remaining for future iterations:
- Verticals/teams management
- Auto-arrange layout
- PNG/PDF export
- Succession planning hints
