# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-07-28

### Added
- **SEO Landing Pages**: Added 11 static, crawlable landing pages (`/design-org-chart/`, `/engineering-org-chart/`, `/product-org-chart/`, `/sales-org-chart/`, `/marketing-org-chart/`, `/hr-org-chart/`, `/finance-org-chart/`, `/healthcare-org-chart/`, `/legal-org-chart/`, `/construction-org-chart/`, `/education-org-chart/`), each with industry-specific meta tags, career levels, common roles, and a real example chart screenshot.
- **Live Example Charts**: Each landing page's primary CTA opens a real, pre-filled example chart for that industry via the new URL import feature instead of a blank app.
- **Load a Chart via Link**: Added a `?chart=` URL parameter that imports a chart directly from a base64url-encoded payload, reusing the existing JSON import contract (`src/utils/importData.ts`), with auto-arrange applied when no explicit positions are supplied. Documented in README for agents/automation to build shareable chart links.
- **`sitemap.xml` / `robots.txt`**: Added for landing page discoverability.
- **Keyboard Shortcuts**: `Delete`/`Backspace` deletes the selected card, `Escape` closes the side panel, `Tab`/`Shift+Tab` cycles a focus highlight between cards without opening the panel, and `Enter` opens the panel for the focused card.

### Fixed
- Static landing pages under `public/` now resolve correctly in both the Vite dev server and production static hosting (previously fell back to the SPA shell due to missing directory-index handling); all internal links now consistently use trailing-slash URLs.
- Fixed a React StrictMode timing bug where the URL-based chart import could silently never run in development.

### Technical
- Extracted the shared `ImportData`/`isImportData` contract out of `SettingsPanel.tsx` into `src/utils/importData.ts`, used by both the file-based JSON import and the new URL-based import.
- Added a dev-only Vite middleware plus `appType: 'mpa'` so local `npm run dev` serves the static SEO pages the same way production does.

## [1.2.0] - 2026-07-13

### Added
- **Loose Connection Card Creation**: Dragging a connection from a card and dropping it on empty canvas now creates a connected team member at the drop point.
- **Growth Plan JSON Export**: Added structured Growth Plan export with per-member Planned, Doing, and Completed sections plus meeting notes.
- **Chart PNG Export Beta**: Added generated chart image export that renders from stored chart data instead of DOM capture.
- **Chart JSON Export Labeling**: Settings export actions now separate Chart JSON, Chart PNG, and Growth Plan JSON.
- **Quickstart Skip Setup**: Added an explicit skip setup path that closes quickstart and suppresses the step-by-step onboarding tour.
- **SEO/AEO Backlog**: Added todo items for crawlable landing pages, structured data, `llms.txt`, `agents.md`, schemas, and examples.

### Changed
- Growth Plan now supports `#growth-plan` URL routing so refresh keeps the active tab.
- Growth Plan member header now groups the member name with role and level chips instead of floating role text on the right.
- Growth Plan add buttons are disabled until text is entered.
- Growth Plan composer buttons now sit below textareas to avoid resize-handle overlap.
- Chart PNG export uses larger text, higher contrast headers, stronger edges, and higher-resolution canvas output for readability.
- Import/Export settings button labels are shorter and grouped by chart exports first.

### Fixed
- Closing quickstart no longer unintentionally forces users through the tooltip onboarding when they choose to skip setup.
- Chart PNG export text and header contrast are improved for generated images.

### Technical
- Added shared export utilities for safe filenames, downloads, Growth Plan JSON export, and data-generated chart SVG/PNG export.
- Added React Flow connection-end handling with persisted drop-position placement for newly created connected team members.

## [1.1.0] - 2026-07-11

### Added
- **Growth Plan Beta**: Added a new Growth Plan workspace alongside the Chart view.
  - Team-member roster for switching between hired team members
  - Per-member growth plan Kanban board with Planned, Doing, and Completed columns
  - Task detail panel for adding additional information to growth plan cards
  - Meeting notes capture for growth conversations and 1:1s
  - Inline member name editing from the Growth Plan detail view
- **Growth Plan Tab Badge**: Added a compact orange Beta tag to the Growth Plan tab.

### Changed
- Chart and Growth Plan now use segmented top-level navigation.
- Chart stays mounted while switching tabs to avoid camera refocus when returning from Growth Plan.
- Initial chart fit on page refresh is now instant instead of animated.
- Growth Plan excludes planned hires and only shows hired team members.
- Meeting note and growth card add actions now live inside their text input areas to save vertical space.
- Promotion status tag in the side panel now only appears when a member is ready for promotion.

### Fixed
- Chart right-side editor panel reliably opens when tapping a chart card.
- Chart onboarding no longer appears while the Growth Plan tab is active.
- JSON export/import now preserves node positions.
- JSON import now validates shape before writing data into app state.
- PostHog no longer initializes when no public key is configured.

### Technical
- Lazy-loaded analytics and secondary app surfaces to reduce the initial bundle size.
- Removed unused `html2canvas` dependency and attribution.
- Added persisted Growth Plan item and meeting note fields to team member data.

## [1.0.4] - 2026-02-04

### Fixed
- **Quickstart Not Triggering in Private Windows**: Fixed race condition in useEffect where state update triggered cleanup before the timer could fire. Now uses ref instead of state to prevent re-render interference.
- **Quickstart Flag Not Cleared on Data Reset**: Quickstart seen flag is now cleared when user clears all data, allowing quickstart to show again for fresh starts.

### Technical
- Moved `QUICKSTART_SEEN_KEY` constant to shared `constants/onboarding.ts`
- Fixed all pre-existing lint errors across multiple files:
  - `Onboarding.tsx`: Fixed variable access before declaration
  - `Toolbar.tsx`: Added eslint-disable for intentional setState pattern
  - `SidePanel.tsx`: Fixed memoization dependencies, added eslint-disable for intentional effects
  - `useStore.ts`: Replaced `any` type with proper type definition
  - `calculations.ts`: Changed `let` to `const` for never-reassigned variable

## [1.0.3] - 2026-02-03

### Added
- **Clear Data Resets Settings**: Clearing all data now resets levels, role types, and team name to blank slate defaults (matching the "Custom" quickstart option)

### Fixed
- **Report Badge Positioning**: Repositioned report badge below the handle to avoid interfering with node selection

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
