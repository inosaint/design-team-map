import { useState, useEffect } from 'react';
import styles from './Onboarding.module.css';

const ONBOARDING_KEY = 'design-team-map-onboarding-completed';

interface OnboardingStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: OnboardingStep[] = [
  {
    target: '[data-testid="add-member-btn"]',
    title: 'Add Team Members',
    content: 'Click here to add new team members or planned hires to your org chart.',
    position: 'bottom',
  },
  {
    target: '.react-flow__node',
    title: 'Click to Edit',
    content: 'Click any card to select it and edit details in the side panel.',
    position: 'right',
  },
  {
    target: '.react-flow__node',
    title: 'Drag to Move',
    content: 'Grab the grip handle (⋮⋮) or anywhere on the card to drag and reposition it.',
    position: 'bottom',
  },
  {
    target: '.react-flow__handle',
    title: 'Connect to Set Manager',
    content: 'Drag from the bottom handle of a manager to the top handle of a report to create reporting relationships.',
    position: 'bottom',
  },
];

export default function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delay to allow the app to render first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

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
    // Re-calculate on resize/scroll
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
    };
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const tooltipStyle = getTooltipPosition(targetRect, step.position);

  return (
    <div className={styles.overlay}>
      {targetRect && (
        <div
          className={styles.spotlight}
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      <div className={styles.tooltip} style={tooltipStyle}>
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

  const offset = 12;
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
        top: targetRect.top - tooltipHeight - offset,
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
