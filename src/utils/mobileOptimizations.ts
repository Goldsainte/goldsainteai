/**
 * Mobile Optimizations Utilities
 * Collection of utilities to enhance mobile user experience
 */

/**
 * Haptic Feedback for Mobile Interactions
 * Provides tactile feedback on supported devices
 */
export const hapticFeedback = {
  /**
   * Light tap feedback for button presses
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium feedback for important actions
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Strong feedback for critical actions or errors
   */
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },

  /**
   * Success pattern (double tap)
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern (warning buzz)
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  },
};

/**
 * Detect if user is on a mobile device
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if user is on iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect if user is on Android
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Prevent zoom on double tap (iOS Safari)
 */
export const preventDoubleTapZoom = (element: HTMLElement) => {
  let lastTap = 0;
  element.addEventListener('touchend', (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault();
    }
    lastTap = currentTime;
  });
};

/**
 * Lock scroll (useful for modals)
 */
export const lockScroll = () => {
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';
};

/**
 * Unlock scroll
 */
export const unlockScroll = () => {
  try {
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.top = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';
  } catch {
    // silent
  }
};

// Safety: ensure body is never left locked across navigation/unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unlockScroll();
  });
}

/**
 * Get safe area insets for iOS notch/Dynamic Island
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
};

/**
 * Optimize image loading for mobile
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number = 800,
  quality: number = 80
): string => {
  // If using a service like Cloudinary or imgix, add optimization params
  // For now, return original URL
  return url;
};

/**
 * Check if user prefers reduced motion (accessibility)
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Smooth scroll to element with offset for fixed headers
 */
export const scrollToElement = (
  elementId: string,
  offset: number = 80,
  behavior: ScrollBehavior = 'smooth'
) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: prefersReducedMotion() ? 'auto' : behavior,
  });
};

/**
 * Detect if keyboard is visible (Android/iOS)
 */
export const isKeyboardVisible = (): boolean => {
  if (isIOS()) {
    // On iOS, check if viewport height changed
    return window.innerHeight < window.screen.height * 0.75;
  }
  return false;
};

/**
 * Add pull-to-refresh functionality
 */
export const addPullToRefresh = (
  element: HTMLElement,
  onRefresh: () => Promise<void>
) => {
  let startY = 0;
  let isPulling = false;

  element.addEventListener('touchstart', (e) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].pageY;
      isPulling = true;
    }
  });

  element.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;

    if (distance > 80) {
      // Trigger refresh
      isPulling = false;
      onRefresh();
    }
  });

  element.addEventListener('touchend', () => {
    isPulling = false;
  });
};

/**
 * Get device pixel ratio for high-DPI displays
 */
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

/**
 * Format file size for mobile (shorter labels)
 */
export const formatFileSizeMobile = (bytes: number): string => {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};

/**
 * Share content using native share API (mobile)
 */
export const nativeShare = async (data: {
  title?: string;
  text?: string;
  url?: string;
}) => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      hapticFeedback.success();
      return true;
    } catch (error) {
      console.log('Share cancelled or failed', error);
      return false;
    }
  }
  return false;
};

/**
 * Copy to clipboard with mobile feedback
 */
export const copyToClipboardMobile = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    hapticFeedback.success();
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    hapticFeedback.error();
    return false;
  }
};

/**
 * Request fullscreen (mobile video/images)
 */
export const requestFullscreen = (element: HTMLElement) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    (element as any).mozRequestFullScreen();
  }
};

/**
 * Exit fullscreen
 */
export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    (document as any).mozCancelFullScreen();
  }
};
