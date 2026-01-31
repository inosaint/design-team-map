import posthog from 'posthog-js'

// Initialize PostHog - call this once at app startup
export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '', {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      respect_dnt: true,
    })

    // Expose to window for debugging
    ;(window as unknown as { posthog: typeof posthog }).posthog = posthog
  }
}

// Analytics event types
export const AnalyticsEvents = {
  // Card events
  CARD_CREATED: 'card_created',
  PLANNED_HIRE_CREATED: 'planned_hire_created',
  CARD_DELETED: 'card_deleted',
  CARD_CONVERTED: 'card_converted_to_hired',

  // Import/Export events
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',

  // Settings events
  TOGGLE_SHOW_GENDER: 'toggle_show_gender',
  TOGGLE_SHOW_MINIMAP: 'toggle_show_minimap',
  SPAN_OF_CONTROL_CHANGED: 'span_of_control_changed',
  TRACK_SPLIT_LEVEL_CHANGED: 'track_split_level_changed',

  // Team events
  TEAM_NAME_CHANGED: 'team_name_changed',

  // Data management
  DATA_CLEARED: 'data_cleared',
  SETTINGS_RESET: 'settings_reset',
} as const

// Track card creation
export const trackCardCreated = (cardType: 'team_member' | 'planned_hire', properties?: Record<string, unknown>) => {
  const event = cardType === 'planned_hire' ? AnalyticsEvents.PLANNED_HIRE_CREATED : AnalyticsEvents.CARD_CREATED
  posthog.capture(event, {
    card_type: cardType,
    ...properties,
  })
}

// Track card deletion
export const trackCardDeleted = (isPlannedHire: boolean) => {
  posthog.capture(AnalyticsEvents.CARD_DELETED, {
    card_type: isPlannedHire ? 'planned_hire' : 'team_member',
  })
}

// Track card conversion (planned hire to hired)
export const trackCardConverted = () => {
  posthog.capture(AnalyticsEvents.CARD_CONVERTED)
}

// Track data export
export const trackDataExported = (format: string, teamSize: number, plannedHires: number) => {
  posthog.capture(AnalyticsEvents.DATA_EXPORTED, {
    format,
    team_size: teamSize,
    planned_hires: plannedHires,
  })
}

// Track data import
export const trackDataImported = (teamSize: number, plannedHires: number) => {
  posthog.capture(AnalyticsEvents.DATA_IMPORTED, {
    team_size: teamSize,
    planned_hires: plannedHires,
  })
}

// Track toggle changes
export const trackToggleChanged = (toggleName: 'showGender' | 'showMinimap', enabled: boolean) => {
  const event = toggleName === 'showGender'
    ? AnalyticsEvents.TOGGLE_SHOW_GENDER
    : AnalyticsEvents.TOGGLE_SHOW_MINIMAP

  posthog.capture(event, {
    enabled,
  })
}

// Track span of control change
export const trackSpanOfControlChanged = (value: number) => {
  posthog.capture(AnalyticsEvents.SPAN_OF_CONTROL_CHANGED, {
    value,
  })
}

// Track track split level change
export const trackTrackSplitLevelChanged = (value: number) => {
  posthog.capture(AnalyticsEvents.TRACK_SPLIT_LEVEL_CHANGED, {
    value,
  })
}

// Track team name change
export const trackTeamNameChanged = () => {
  posthog.capture(AnalyticsEvents.TEAM_NAME_CHANGED)
}

// Track data cleared
export const trackDataCleared = () => {
  posthog.capture(AnalyticsEvents.DATA_CLEARED)
}

// Track settings reset
export const trackSettingsReset = () => {
  posthog.capture(AnalyticsEvents.SETTINGS_RESET)
}

// Export posthog instance for direct access if needed
export { posthog }
