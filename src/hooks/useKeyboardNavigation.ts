import { useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

/**
 * Hook to manage keyboard navigation and focus trapping
 * Provides accessibility features for modals, dialogs, and interactive components
 */
export function useKeyboardNavigation(
  isActive: boolean,
  options: KeyboardNavigationOptions = {}
) {
  const {
    onEscape,
    onEnter,
    trapFocus = false,
    restoreFocus = true,
    autoFocus = true,
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store previously focused element
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Auto-focus first focusable element
    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
      }

      if (e.key === "Enter" && onEnter && e.target === document.activeElement) {
        e.preventDefault();
        onEnter();
      }

      // Focus trap
      if (trapFocus && e.key === "Tab" && containerRef.current) {
        const focusableElements = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus when component unmounts
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, onEscape, onEnter, trapFocus, restoreFocus, autoFocus]);

  return containerRef;
}
