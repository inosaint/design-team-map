# Release Process

This document outlines the steps to follow when releasing a new version.

## Version Locations

The version number must be updated in these locations:

1. **Changelog**: `CHANGELOG.md` - Add new version entry at the top
2. **Settings Page**: `src/components/panels/SettingsPanel.tsx` - Update the version in the About tab (search for `<span className={styles.version}>`)

## Steps to Release

1. **Update CHANGELOG.md**
   - Add a new version section at the top (e.g., `## [0.4.0] - YYYY-MM-DD`)
   - Document all changes under appropriate headings: Added, Changed, Fixed, Technical

2. **Update version in Settings**
   - Open `src/components/panels/SettingsPanel.tsx`
   - Find the About tab section and update the version string (e.g., `v0.4.0`)

3. **Update README.md** (if needed)
   - Update features list if new features were added
   - Update any changed URLs or documentation

4. **Pre-Release Review** (see `todo.md` for full checklist)
   - Review CHANGELOG.md for accuracy and completeness
   - Verify version number updated in SettingsPanel.tsx
   - Check README.md is up to date (features, URLs, license)
   - Ensure LICENSE file matches README license reference
   - Test quickstart wizard and onboarding tour
   - Test export functionality (PNG, PDF, JSON)
   - Run `npm run build` and `npm run lint` - fix any issues
   - Test in multiple browsers (Chrome, Firefox, Safari)

5. **Commit changes together**
   - Use a commit message like: `chore: Bump version to 0.4.0`

## Version Format

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Display format in UI: `v0.x.x` (with 'v' prefix)
- Changelog format: `[0.x.x]` (without 'v' prefix)
