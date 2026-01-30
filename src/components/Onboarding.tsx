import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import styles from './Onboarding.module.css';

const ONBOARDING_KEY = 'design-team-map-onboarding-completed';
const ONBOARDING_STEP_KEY = 'design-team-map-onboarding-step';

interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  requiresCard?: boolean;
}

const steps: OnboardingStep[] = [
  {
    target: '[data-testid="add-member-btn"]',
    title: 'Add Team Members',
    content: 'Click here to add new team members or planned hires to your org chart.',
    position: 'bottom',
    requiresCard: false,
  },
  {
    target: '.react-flow__node',
    title: 'Click to Edit',
    content: 'Click any card to select it and edit details in the side panel.',
    position: 'left',
    requiresCard: true,
  },
  {
    target: '.react-flow__node',
    title: 'Drag to Move',
    content: 'Drag anywhere on the card to reposition it on the canvas.',
    position: 'left',
    requiresCard: true,
  },
  {
    target: '.react-flow__node',
    title: 'Connect to Set Manager',
    content: 'Drag between handles to connect cards, or use the Manager dropdown in the editor panel.',
    position: 'top',
    requiresCard: true,
  },
];

export default function Onboarding() {
  const nodes = useStore((state) => state.nodes);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [waitingForCard, setWaitingForCard] = useState(false);
  const prevNodeCount = useRef(nodes.length);

  const hasCards = nodes.length > 0;

  // Initialize onboarding on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed) return;

    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    const stepNum = savedStep ? parseInt(savedStep, 10) : 0;

    setCurrentStep(stepNum);

    // If step requires card and none exist, wait for cards
    if (stepNum > 0 && steps[stepNum]?.requiresCard) {
      setWaitingForCard(true);
      return;
    }

    // Delay to allow the app to render first
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Watch for card additions when waiting
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed) return;

    // Detect when a card is added (node count increases)
    if (nodes.length > prevNodeCount.current && waitingForCard) {
      setWaitingForCard(false);
      // Delay to let the card render and user see it
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    prevNodeCount.current = nodes.length;
  }, [nodes.length, waitingForCard]);

  // Find and update target element position
  useEffect(() => {
    if (!isVisible) return;

    const findTarget = () => {
      const step = steps[currentStep];
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

    if (nextStep >= steps.length) {
      handleComplete();
      return;
    }

    // If next step requires a card and none exist, pause and wait
    if (steps[nextStep].requiresCard && !hasCards) {
      localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
      setCurrentStep(nextStep);
      setIsVisible(false);
      setWaitingForCard(true);
      return;
    }

    localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
    setCurrentStep(nextStep);
  }, [currentStep, hasCards]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setIsVisible(false);
    setWaitingForCard(false);
  }, []);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const tooltipStyle = getTooltipPosition(targetRect, step.position);
  const arrowClass = styles[`arrow${step.position.charAt(0).toUpperCase() + step.position.slice(1)}`];

  return (
    <div className={`${styles.tooltip} ${arrowClass}`} style={tooltipStyle}>
      <div className={styles.header}>
        <span className={styles.title}>{step.title}</span>
        <span className={styles.stepCount}>
          {currentStep + 1} / {steps.length}
        </span>
      </div>
      <p className={styles.content}>{step.content}</p>
      <div className={styles.actions}>
        <button className={styles.skipBtn} onClick={handleSkip}>
          Skip Tour
        </button>
        <button className={styles.nextBtn} onClick={handleNext}>
          {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
        </button>
      </div>
    </div>
  );
}

function getTooltipPosition(
  targetRect: DOMRect | null,
  position: OnboardingStep['position']
): React.CSSProperties {
  if (!targetRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const offset = 16; // Increased offset for arrow space
  const tooltipWidth = 280;
  const tooltipHeight = 150;

  switch (position) {
    case 'bottom':
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      };
    case 'top':
      return {
        top: targetRect.top - tooltipHeight - offset - 20, // Extra space so card is visible
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      };
    case 'right':
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.right + offset,
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.left - tooltipWidth - offset,
      };
  }
}
