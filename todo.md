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
- [x] Implement auto-arrange/layout algorithm
- [x] Add zoom/pan controls
- [x] Top-level nodes: no target handle (head of design can't report to anyone)
- [x] Leadership nodes: hide designer type badge

## Phase 4: Node Interactions
- [x] Click node to open side panel with details
- [x] Edit member details (name, type, level, years of experience)
- [x] Add/edit joining date for existing members
- [x] Add/edit tentative date (month/quarter) for planned hires
- [x] Change reporting structure via drag-drop (connect nodes)
- [x] Delete node functionality
- [x] Add new member / planned hire
- [x] Disconnect button to remove manager relationship
- [x] Click on edge to delete reporting relationship
- [x] Notes field for each designer card
- [x] Gender field (optional, configurable in Advanced settings)
- [x] Growth status tag in side panel header
- [x] Create a connected team member when a user drags a connection from a source handle and drops it on empty canvas

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
- [x] Accordion UI for level cards (easier overview)
- [x] Track toggle (IC/Manager) for levels at/above split level
- [x] Reorganized tabs: Levels, Types, Rules, Export, Data, Advanced
- [x] Advanced settings: Gender field toggle, Minimap toggle

## Phase 7: Rules & Validation
- [x] Visual warning when manager has >6 reports (red edge with warning icon)
- [x] Calculate promotion eligibility based on tenure and level config
- [x] Show growth eligibility indicator on nodes (green glow effect)
- [x] IC/Manager career track split configuration
- [ ] Succession planning hints (who can grow into which role)

## Phase 8: Export & Polish
- [x] Export flowchart as PNG (generated SVG-to-PNG export, marked Beta)
- [x] Export flowchart as PDF (via browser print with print styles)
- [x] Export/Import team data as JSON (Chart JSON backup/restore)
- [x] Export growth plan as structured JSON with planned/doing/completed sections and meeting notes
- [x] Custom app logo and favicon
- [x] Side panel closing animation
- [ ] Responsive design adjustments
- [ ] Keyboard shortcuts
- [x] Empty state and onboarding hints
- [x] Growth Plan tab supports hash URL (`#growth-plan`) so refresh keeps the active view
- [x] Growth Plan add buttons stay disabled until text is entered
- [x] Growth Plan textarea/button layout avoids resize-handle overlap
- [x] Quickstart wizard has a skip setup path that suppresses the step-by-step onboarding tour

## Phase 9: SEO, AEO & Agent Accessibility
- [ ] Add core SEO metadata in `index.html`: title, description, canonical URL, Open Graph, and Twitter card tags for MapYour.Org
- [ ] Add JSON-LD `SoftwareApplication` structured data describing MapYour.Org as a free web app for org charts, hiring plans, and growth planning
- [ ] Add JSON-LD `FAQPage` structured data for core AEO questions: what MapYour.Org is, who it is for, whether it is free, what it exports, and where data is stored
- [ ] Add crawlable homepage/landing copy with clear Q&A sections for answer engines
- [ ] Create focused crawlable landing pages for high-value use cases: free org chart tool, design team org chart, team growth plan template, hiring plan org chart, and startup org chart tool
- [ ] Add `/llms.txt` that explains the product, key URLs, import/export capabilities, and recommended agent workflows
- [ ] Add `/agents.md` with instructions for agents to create Chart JSON, Growth Plan JSON, and planning templates for users
- [ ] Add Markdown docs for import/export formats: `/docs/chart-json.md` and `/docs/growth-plan-json.md`
- [ ] Add machine-readable JSON schemas for Chart JSON and Growth Plan JSON exports
- [ ] Add example import files such as `/docs/examples/design-team.json` and `/docs/examples/startup-team.json`
- [ ] Add an in-app import guidance flow with schema validation errors and links to examples

---

## Pre-Release Review Tasks
- [ ] Review CHANGELOG.md for accuracy and completeness
- [ ] Verify version number updated in SettingsPanel.tsx
- [ ] Check README.md is up to date (features, URLs, license)
- [ ] Ensure LICENSE file matches README license reference
- [ ] Test quickstart wizard flow end-to-end
- [ ] Test onboarding tour for new users
- [ ] Verify analytics events are firing correctly
- [ ] Test export functionality (PNG, PDF, JSON)
- [ ] Test Growth Plan JSON export structure with planned, doing, completed, and meeting notes data
- [ ] Test loose-connection card creation from drag-release on empty canvas
- [ ] Test import/restore from JSON backup
- [ ] Check mobile responsiveness
- [ ] Run `npm run build` and verify no errors
- [ ] Run `npm run lint` and fix any issues
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)

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
- Verticals/teams management on canvas
- Succession planning hints
- Responsive design adjustments
- Keyboard shortcuts
- Distributed teams support (setting in Advanced)
- Drag-and-drop reordering of level accordions
- Fix glitchy tooltip on hover (span of control warning)
- SEO/AEO landing pages and agent-readable docs (`llms.txt`, `agents.md`, schemas, examples)
