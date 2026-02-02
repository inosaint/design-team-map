import posthog from 'posthog-js'

// Initialize PostHog - call this once at app startup
export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    const token = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '';
    const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    // Debug: log env values (remove after fixing)
    console.log('[PostHog] Initializing with token:', token ? `${token.substring(0, 10)}...` : '(empty)');
    console.log('[PostHog] API host:', host);

    posthog.init(token, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      respect_dnt: false, // Set to false to ensure events fire during testing
      loaded: (ph) => {
        // Enable debug mode in development to see all events in console
        if (import.meta.env.DEV) {
          ph.debug()
        }
      },
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

  // Quickstart events
  QUICKSTART_STARTED: 'quickstart_started',
  QUICKSTART_STEP_COMPLETED: 'quickstart_step_completed',
  QUICKSTART_COMPLETED: 'quickstart_completed',
  QUICKSTART_DISMISSED: 'quickstart_dismissed',
  QUICKSTART_INDUSTRY_SELECTED: 'quickstart_industry_selected',
  QUICKSTART_TEAM_SIZE_SELECTED: 'quickstart_team_size_selected',
  QUICKSTART_STRUCTURE_SELECTED: 'quickstart_structure_selected',
  QUICKSTART_ROLE_TYPE_SELECTED: 'quickstart_role_type_selected',

  // Onboarding events
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
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

// Quickstart tracking functions
export const trackQuickstartStarted = () => {
  posthog.capture(AnalyticsEvents.QUICKSTART_STARTED)
}

export const trackQuickstartStepCompleted = (step: number, stepName: string) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_STEP_COMPLETED, {
    step,
    step_name: stepName,
  })
}

export const trackQuickstartCompleted = (properties: {
  industry: string;
  teamSize: number;
  structure: string;
  roleTypes: string[];
}) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_COMPLETED, {
    industry: properties.industry,
    team_size: properties.teamSize,
    structure: properties.structure,
    role_types: properties.roleTypes,
    role_types_count: properties.roleTypes.length,
  })
}

export const trackQuickstartDismissed = (step: number) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_DISMISSED, {
    dismissed_at_step: step,
  })
}

export const trackQuickstartIndustrySelected = (industry: string) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_INDUSTRY_SELECTED, {
    industry,
  })
}

export const trackQuickstartTeamSizeSelected = (size: string, count: number) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_TEAM_SIZE_SELECTED, {
    size_category: size,
    team_count: count,
  })
}

export const trackQuickstartStructureSelected = (structure: string) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_STRUCTURE_SELECTED, {
    structure,
  })
}

export const trackQuickstartRoleTypeSelected = (roleTypes: string[]) => {
  posthog.capture(AnalyticsEvents.QUICKSTART_ROLE_TYPE_SELECTED, {
    role_types: roleTypes,
    count: roleTypes.length,
  })
}

// Onboarding tracking functions
export const trackOnboardingStepViewed = (stepId: string, stepTitle: string, mode: string) => {
  posthog.capture(AnalyticsEvents.ONBOARDING_STEP_VIEWED, {
    step_id: stepId,
    step_title: stepTitle,
    onboarding_mode: mode,
  })
}

export const trackOnboardingCompleted = (mode: string) => {
  posthog.capture(AnalyticsEvents.ONBOARDING_COMPLETED, {
    onboarding_mode: mode,
  })
}

export const trackOnboardingSkipped = (stepId: string, mode: string) => {
  posthog.capture(AnalyticsEvents.ONBOARDING_SKIPPED, {
    skipped_at_step: stepId,
    onboarding_mode: mode,
  })
}

// Export posthog instance for direct access if needed
export { posthog }
