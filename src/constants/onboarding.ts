// Onboarding localStorage keys
export const ONBOARDING_COMPLETED_KEY = 'org-map-onboarding-completed';
export const ONBOARDING_STEP_KEY = 'org-map-onboarding-step';
export const ONBOARDING_MODE_KEY = 'org-map-onboarding-mode';
export const QUICKSTART_SEEN_KEY = 'org-mapper-quickstart-seen';

// Helper to clear all onboarding state from localStorage
export function clearOnboardingState(): void {
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  localStorage.removeItem(ONBOARDING_STEP_KEY);
  localStorage.removeItem(ONBOARDING_MODE_KEY);
  localStorage.removeItem(QUICKSTART_SEEN_KEY);
}
