/**
 * Skip Navigation Component
 * Provides keyboard users a way to bypass repetitive navigation
 * WCAG 2.1 Level A - 2.4.1 Bypass Blocks
 */

export const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
    >
      Skip to main content
    </a>
  );
};
