import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import styles from './Onboarding.module.css';
import {
  trackOnboardingStepViewed,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
} from '../utils/analytics';

const ONBOARDING_KEY = 'design-team-map-onboarding-completed';
const ONBOARDING_STEP_KEY = 'design-team-map-onboarding-step';
const ONBOARDING_MODE_KEY = 'design-team-map-onboarding-mode';

interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  minCards?: number; // Minimum cards required (0 = no cards needed)
}

// All available steps
const ALL_STEPS: OnboardingStep[] = [
  {
    id: 'add-member',
    target: '[data-testid="add-member-btn"]',
    title: 'Add Team Members',
    content: 'Click here to add new team members or planned hires to your org chart.',
    position: 'bottom',
    minCards: 0,
  },
  {
    id: 'click-edit',
    target: '.react-flow__node',
    title: 'Click to Edit',
    content: 'Click any card to select it and edit details in the side panel.',
    position: 'left',
    minCards: 1,
  },
  {
    id: 'drag-move',
    target: '.react-flow__node',
    title: 'Drag to Move',
    content: 'Drag anywhere on the card to reposition it on the canvas.',
    position: 'left',
    minCards: 1,
  },
  {
    id: 'connect-manager',
    target: '.react-flow__node:nth-of-type(2)',
    title: 'Connect to Set Manager',
    content: 'Drag between handles to connect cards, or use the Manager dropdown in the editor panel.',
    position: 'top',
    minCards: 2,
  },
  {
    id: 'settings',
    target: '[data-testid="settings-btn"]',
    title: 'Customize Your Map',
    content: 'Access settings to customize role types, levels, colors, and export your org chart.',
    position: 'bottom',
    minCards: 0,
  },
];

// Step sequences for different onboarding modes
const STEP_SEQUENCES: Record<string, string[]> = {
  // Regular onboarding (no quickstart): Full sequence
  regular: ['add-member', 'click-edit', 'drag-move', 'connect-manager', 'settings'],
  // Post-quickstart onboarding: Drag to move → Settings (cards already exist)
  'post-quickstart': ['drag-move', 'settings'],
};

// Get steps for a given mode
function getStepsForMode(mode: string): OnboardingStep[] {
  const sequence = STEP_SEQUENCES[mode] || STEP_SEQUENCES.regular;
  return sequence
    .map(id => ALL_STEPS.find(s => s.id === id))
    .filter((s): s is OnboardingStep => s !== undefined);
}

interface OnboardingProps {
  mode?: 'regular' | 'post-quickstart';
}

export default function Onboarding({ mode: propMode }: OnboardingProps) {
  const nodes = useStore((state) => state.nodes);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [waitingForCards, setWaitingForCards] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<string>('regular');
  const timerRef = useRef<number | null>(null);

  // Get steps based on current mode
  const steps = getStepsForMode(onboardingMode);
  const cardCount = nodes.length;
  const currentStepMinCards = steps[currentStep]?.minCards ?? 0;
  const hasEnoughCards = cardCount >= currentStepMinCards;

  // Initialize onboarding on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed) return;

    // Determine mode from prop or localStorage
    const savedMode = localStorage.getItem(ONBOARDING_MODE_KEY);
    const effectiveMode = propMode || savedMode || 'regular';
    setOnboardingMode(effectiveMode);
    localStorage.setItem(ONBOARDING_MODE_KEY, effectiveMode);

    const modeSteps = getStepsForMode(effectiveMode);
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    const parsedStep = savedStep ? parseInt(savedStep, 10) : 0;
    // Clamp step to valid bounds to prevent out-of-bounds access when mode changes
    const stepNum = Math.max(0, Math.min(parsedStep, modeSteps.length - 1));
    const stepMinCards = modeSteps[stepNum]?.minCards ?? 0;
    setCurrentStep(stepNum);

    // If step requires more cards than we have, wait
    if (cardCount < stepMinCards) {
      setWaitingForCards(true);
      return;
    }

    // Delay to allow the app to render first
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [propMode]);

  // Watch for card additions when waiting
  useEffect(() => {
    if (!waitingForCards) return;
    if (!hasEnoughCards) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setWaitingForCards(false);
      setIsVisible(true);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [waitingForCards, hasEnoughCards]);

  // Pause tour if cards are deleted and we no longer have enough
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed) return;

    // If tooltip is visible but we don't have enough cards anymore, pause
    if (isVisible && !hasEnoughCards) {
      setIsVisible(false);
      setWaitingForCards(true);
    }
  }, [isVisible, hasEnoughCards, currentStepMinCards, cardCount]);

  // Find and update target element position
  useEffect(() => {
    if (!isVisible) return;

    const findTarget = () => {
      const step = steps[currentStep];
      if (!step) return;
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    // Re-check periodically in case nodes are rendered after flow updates
    const interval = setInterval(findTarget, 500);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
      clearInterval(interval);
    };
  }, [isVisible, currentStep]);

  const handleNext = useCallback(() => {
    const nextStep = currentStep + 1;
    const nextStepMinCards = steps[nextStep]?.minCards ?? 0;

    if (nextStep >= steps.length) {
      handleComplete();
      return;
    }

    // If next step requires more cards than we have, pause and wait
    if (cardCount < nextStepMinCards) {
      localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
      setCurrentStep(nextStep);
      setIsVisible(false);
      setWaitingForCards(true);
      return;
    }

    localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
    setCurrentStep(nextStep);
  }, [currentStep, cardCount]);

  const handleSkip = useCallback(() => {
    const step = steps[currentStep];
    if (step) {
      trackOnboardingSkipped(step.id, onboardingMode);
    }
    handleComplete();
  }, [currentStep, steps, onboardingMode]);

  const handleComplete = useCallback(() => {
    trackOnboardingCompleted(onboardingMode);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsVisible(false);
    setWaitingForCards(false);
  }, [onboardingMode]);

  // Track when step is viewed
  useEffect(() => {
    if (isVisible && steps[currentStep]) {
      trackOnboardingStepViewed(steps[currentStep].id, steps[currentStep].title, onboardingMode);
    }
  }, [isVisible, currentStep, steps, onboardingMode]);

  if (!isVisible) return null;

  const step = steps[currentStep];
  // Defensive check: if step is undefined (shouldn't happen after bounds fix), don't render
  if (!step) return null;

  const { style: tooltipStyle, arrowOffset } = getTooltipPosition(targetRect, step.position);
  const arrowClass = styles[`arrow${step.position.charAt(0).toUpperCase() + step.position.slice(1)}`];

  return (
    <div
      className={`${styles.tooltip} ${arrowClass}`}
      style={{ ...tooltipStyle, '--arrow-offset': `${arrowOffset}px` } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span className={styles.title}>{step.title}</span>
      </div>
      <p className={styles.content}>{step.content}</p>
      <div className={styles.actions}>
        <button className={styles.skipBtn} onClick={handleSkip}>
          Skip Tour
        </button>
        <button className={styles.nextBtn} onClick={handleNext}>
          Ok
        </button>
      </div>
    </div>
  );
}

function getTooltipPosition(
  targetRect: DOMRect | null,
  position: OnboardingStep['position']
): { style: React.CSSProperties; arrowOffset: number } {
  if (!targetRect) {
    return {
      style: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
      arrowOffset: 140, // Center of 280px tooltip
    };
  }

  const offset = 16; // Increased offset for arrow space
  const tooltipWidth = 280;
  const tooltipHeight = 150;
  const padding = 16; // Minimum padding from viewport edges

  let top: number;
  let left: number;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  switch (position) {
    case 'bottom':
      top = targetRect.bottom + offset;
      left = targetCenterX - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.top - tooltipHeight - offset - 20; // Extra space so card is visible
      left = targetCenterX - tooltipWidth / 2;
      break;
    case 'right':
      top = targetCenterY - tooltipHeight / 2;
      left = targetRect.right + offset;
      break;
    case 'left':
      top = targetCenterY - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - offset;
      break;
  }

  // Clamp to viewport bounds
  const clampedTop = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
  const clampedLeft = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

  // Calculate arrow offset based on how much the tooltip was shifted
  let arrowOffset: number;
  if (position === 'bottom' || position === 'top') {
    // Arrow should point to target center X relative to tooltip's left edge
    arrowOffset = targetCenterX - clampedLeft;
    // Clamp arrow to stay within tooltip bounds (with some padding)
    arrowOffset = Math.max(20, Math.min(arrowOffset, tooltipWidth - 20));
  } else {
    // For left/right positions, arrow offset is vertical
    arrowOffset = targetCenterY - clampedTop;
    arrowOffset = Math.max(20, Math.min(arrowOffset, tooltipHeight - 20));
  }

  return { style: { top: clampedTop, left: clampedLeft }, arrowOffset };
}
