# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-02-03

### Fixed
- Disconnecting a reporting line no longer incorrectly promotes the card to top-level status. Cards now return to "unassigned" state where they can still receive a new manager.

## [1.0.1] - 2026-02-02

### Fixed
- **Onboarding Crash**: Fixed TypeError when selecting industry preset after clearing data
  - Root cause: Stale `currentStep` in localStorage exceeded bounds when switching onboarding modes
  - Added bounds clamping and defensive null checks

### Changed
- **Renamed localStorage Keys**: Onboarding keys renamed from `design-team-map-*` to `org-map-*`
- **Clear Data Now Resets Onboarding**: `clearAll()` now clears onboarding state, giving users a fresh experience

### Technical
- Created shared constants file `src/constants/onboarding.ts`
- Removed hardcoded localStorage key strings across components

## [1.0.0] - 2026-02-02

### Added
- **Quickstart Wizard**: New interactive setup wizard for first-time users
  - Industry selection with 12 presets: Design, Engineering, Product, Sales, Marketing, HR, Finance, Healthcare, Legal, Construction, Education, and Custom
  - Team size options: Tiny (1-3), Small (4-8), Medium (9-15), Large (16+)
  - Structure types: Flat, Hierarchical, and Pods-based org structures
  - Live preview illustrations that update based on selections
  - Editable team member count before generation
  - Pre-configured role types and career levels per industry
- **PostHog Analytics**: Usage analytics tracking for key user actions
  - Quickstart wizard events (started, completed, dismissed, selections)
  - Environment-based configuration via `.env`
- **Release Checklist**: Added `RELEASE.md` with version update procedures
- **Quickstart Access**: Settings panel now includes button to restart quickstart wizard

### Changed
- **Rebranded to MapYour.Org**: Updated app name and URLs throughout
- **Industry-Agnostic Defaults**: Default names are now generic (e.g., "Team Member" instead of "Designer")
- **Improved Onboarding**: Mode-based step sequences that adapt to quickstart vs regular flow
- **Better Mobile UX**: Improved quickstart wizard responsiveness on mobile devices

### Fixed
- Card overlap in generated org maps for large teams
- Tooltip arrow positioning issues
- Progress dots center alignment in footer
- Connector lines in medium and pods illustrations
- Illustration spacing and vertical positioning

## [0.3.0] - 2026-01-30

### Added
- **Onboarding Tour**: New contextual onboarding tooltips guide first-time users through key features:
  - Adding team members
  - Clicking cards to edit
  - Dragging cards to reposition
  - Connecting cards to set manager relationships
- **Smart Tour Behavior**: Tour pauses and resumes based on canvas state (waits for cards to exist, pauses if cards are deleted)
- **Connection Handle Hover Effect**: Handles grow from 8px to 12px on hover for better discoverability
- **Grab Cursor**: Cards now show grab/grabbing cursor to indicate draggability

### Changed
- **Improved Handle Visibility**: Connection handles are more discoverable with size increase on hover
- **Designer Type Badge**: Now hidden when no type is selected (instead of showing empty badge)
- **Viewport Auto-fit**: During onboarding, viewport automatically adjusts when cards are added

### Technical
- Onboarding state persisted in localStorage
- Tooltips stay within viewport bounds (clamped to edges)
- Tooltip z-index set below panels so users can still interact with settings/editor

## [0.2.0] - 2026-01-30

### Added
- **Career Track as Levels Setting**: Career track (IC/Manager) is now determined by the level itself, not a separate selector on cards. The level dropdown shows all options with track suffix (e.g., "Senior Designer (IC)", "Design Manager (Manager)").
- **Auto-Split Levels**: When the track split level is changed, levels are automatically regenerated with IC and Manager variants for levels at or above the split point.
- **Head of Design Convergence**: The maximum level (Head of Design) is a single entry where both IC and Manager tracks converge. This level can now be removed if needed for multi-discipline org structures.
- **Circular Reporting Loop Prevention**: Users can no longer create circular reporting relationships (A reports to B, B reports to A). Invalid connections are blocked with a toast notification explaining the error.
- **Toast Notification System**: Added a toast notification system for user feedback on blocked actions.
- **Select Type Placeholder**: New cards now default to "Select type..." placeholder instead of auto-selecting the first designer type.

### Changed
- Level configuration in Settings now shows track badges (IC/MGR/HEAD) for each level entry
- Track split level setting moved to Advanced tab with clearer description
- Removing a track-specific level now also removes its counterpart (IC and Manager levels at the same number are paired)

### Fixed
- Circular reporting loops could previously be created via drag-and-drop connections on the canvas

## [0.1.0] - Initial Release

### Added
- Interactive org chart visualization using React Flow
- Team member and planned hire cards
- Drag-and-drop positioning
- Manager/report relationships with visual connections
- Span of control warnings
- Promotion eligibility tracking
- Settings panel for configuring levels, designer types, and thresholds
- JSON export/import for backup
- Auto-arrange functionality
- Minimap toggle
- Gender field toggle for diversity tracking
