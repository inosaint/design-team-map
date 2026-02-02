// Onboarding localStorage keys
export const ONBOARDING_COMPLETED_KEY = 'org-map-onboarding-completed';
export const ONBOARDING_STEP_KEY = 'org-map-onboarding-step';
export const ONBOARDING_MODE_KEY = 'org-map-onboarding-mode';

// Helper to clear all onboarding state from localStorage
export function clearOnboardingState(): void {
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  localStorage.removeItem(ONBOARDING_STEP_KEY);
  localStorage.removeItem(ONBOARDING_MODE_KEY);
}
