# Release Checklist

Use this checklist when preparing a new release of MapYour.Org.

## Pre-Release

- [ ] All features for this release are complete and merged
- [ ] Code review completed for all changes
- [ ] All tests passing (if applicable)
- [ ] No console errors or warnings in development
- [ ] Tested on major browsers (Chrome, Firefox, Safari, Edge)

## Documentation

- [ ] Update README.md if needed (demo URL, features, etc.)
- [ ] Update CHANGELOG.md with new version and changes
- [ ] Update version number in package.json

## Build & Deploy

- [ ] Run `npm run build` and verify no build errors
- [ ] Test production build locally with `npm run preview`
- [ ] Deploy to staging/production environment
- [ ] Verify deployment is working correctly

## Post-Release

- [ ] Create git tag for the release version
- [ ] Announce release (if applicable)
- [ ] Monitor for any issues

---

## Version Naming

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)
