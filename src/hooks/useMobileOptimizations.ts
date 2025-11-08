import { useEffect, useCallback } from 'react';
import {
  hapticFeedback,
  isMobileDevice,
  isIOS,
  isTouchDevice,
  lockScroll,
  unlockScroll,
  prefersReducedMotion,
} from '@/utils/mobileOptimizations';

/**
 * Hook for mobile-specific optimizations and utilities
 */
export const useMobileOptimizations = () => {
  const isMobile = isMobileDevice();
  const isIOSDevice = isIOS();
  const hasTouch = isTouchDevice();
  const reducedMotion = prefersReducedMotion();

  /**
   * Haptic feedback for button presses
   */
  const vibrate = useCallback(
    (type: 'light' | 'medium' | 'strong' | 'success' | 'error' = 'light') => {
      if (!isMobile) return;
      hapticFeedback[type]();
    },
    [isMobile]
  );

  /**
   * Lock body scroll (for modals)
   */
  const disableScroll = useCallback(() => {
    lockScroll();
  }, []);

  /**
   * Unlock body scroll
   */
  const enableScroll = useCallback(() => {
    unlockScroll();
  }, []);

  /**
   * Check if animations should be disabled
   */
  const shouldReduceMotion = useCallback(() => {
    return reducedMotion;
  }, [reducedMotion]);

  return {
    isMobile,
    isIOSDevice,
    hasTouch,
    reducedMotion,
    vibrate,
    disableScroll,
    enableScroll,
    shouldReduceMotion,
  };
};

/**
 * Hook to handle mobile keyboard visibility
 */
export const useKeyboardVisibility = (callback: (isVisible: boolean) => void) => {
  useEffect(() => {
    if (!isMobileDevice()) return;

    let initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const isKeyboardVisible = currentHeight < initialHeight * 0.75;
      
      // Toggle body class for viewport management
      if (isKeyboardVisible) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
      
      callback(isKeyboardVisible);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('keyboard-open');
    };
  }, [callback]);
};

/**
 * Hook to prevent zoom on iOS Safari
 */
export const usePreventZoom = () => {
  useEffect(() => {
    if (!isIOS()) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventDefault, { passive: false });
    return () => document.removeEventListener('touchstart', preventDefault);
  }, []);
};

/**
 * Hook for pull-to-refresh functionality
 */
export const usePullToRefresh = (
  elementRef: React.RefObject<HTMLElement>,
  onRefresh: () => Promise<void>
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isMobileDevice()) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].pageY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      const currentY = e.touches[0].pageY;
      const distance = currentY - startY;

      if (distance > 80) {
        isPulling = false;
        hapticFeedback.medium();
        onRefresh();
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onRefresh]);
};
