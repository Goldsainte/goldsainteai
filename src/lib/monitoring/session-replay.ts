// Session Replay Configuration for Debugging
import * as Sentry from '@sentry/react';

export interface SessionContext {
  userId?: string;
  userRole?: string;
  subscriptionTier?: string;
  lastAction?: string;
  deviceType?: string;
}

// Initialize session replay with privacy controls
export function initializeSessionReplay() {
  // Session replay is initialized in main.tsx with Sentry.init
  // This file provides helper functions for session management
  
  console.log('[Session Replay] Initialized with privacy masking');
}

// Update session context with user information
export function updateSessionContext(context: SessionContext) {
  Sentry.setUser({
    id: context.userId,
    role: context.userRole,
    subscription: context.subscriptionTier,
  });

  Sentry.setContext('session', {
    lastAction: context.lastAction,
    deviceType: context.deviceType,
    timestamp: new Date().toISOString(),
  });
}

// Tag sessions for easier filtering
export function tagSession(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

// Mark critical user flows for replay capture
export function markCriticalFlow(flowName: string, step?: string) {
  Sentry.addBreadcrumb({
    category: 'critical.flow',
    message: step ? `${flowName}: ${step}` : flowName,
    level: 'info',
    timestamp: Date.now() / 1000,
  });

  // Force replay capture for critical flows
  Sentry.setTag('critical_flow', flowName);
}

// Capture user feedback with session context
export function captureUserFeedback(feedback: {
  name: string;
  email: string;
  message: string;
  eventId?: string;
}) {
  const eventId = feedback.eventId || Sentry.lastEventId();
  
  if (eventId) {
    Sentry.captureFeedback({
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
    });
  }
}

// Privacy-safe error capture
export function captureErrorWithReplay(
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    contexts: {
      replay: {
        included: true,
      },
    },
    extra: context,
  });
}

// Monitor rage clicks (sign of frustration)
export function setupRageClickDetection() {
  let clickCount = 0;
  let clickTimeout: NodeJS.Timeout;

  document.addEventListener('click', (event) => {
    clickCount++;
    
    clearTimeout(clickTimeout);
    
    if (clickCount >= 3) {
      const target = event.target as HTMLElement;
      
      Sentry.captureMessage('Rage click detected', {
        level: 'warning',
        tags: { type: 'ux_issue' },
        extra: {
          element: target.tagName,
          className: target.className,
          id: target.id,
          text: target.textContent?.substring(0, 50),
        },
      });

      markCriticalFlow('rage_click', target.tagName);
      clickCount = 0;
    }

    clickTimeout = setTimeout(() => {
      clickCount = 0;
    }, 1000);
  });
}

// Monitor dead clicks (clicks on non-interactive elements)
export function setupDeadClickDetection() {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.hasAttribute('role') ||
      target.onclick !== null ||
      target.classList.contains('cursor-pointer');

    if (!isInteractive && target !== document.body) {
      Sentry.addBreadcrumb({
        category: 'ui.click',
        message: 'Dead click detected',
        level: 'warning',
        data: {
          element: target.tagName,
          className: target.className,
          text: target.textContent?.substring(0, 50),
        },
      });
    }
  }, { capture: true });
}

// Session replay sampling rules
export function shouldCaptureReplay(context: {
  isError: boolean;
  userId?: string;
  subscriptionTier?: string;
}): boolean {
  // Always capture errors
  if (context.isError) return true;

  // Capture 50% of premium/enterprise users
  if (['premium', 'enterprise'].includes(context.subscriptionTier || '')) {
    return Math.random() < 0.5;
  }

  // Capture 10% of free users
  return Math.random() < 0.1;
}
