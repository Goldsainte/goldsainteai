import { ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { useLocation } from 'react-router-dom';

interface RouteSectionBoundaryProps {
  section: string;
  children: ReactNode;
}

const SectionFallback = ({ section }: { section: string }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 bg-background text-center px-6 py-12">
    <h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
    <p className="text-muted-foreground max-w-xl">
      We hit an unexpected issue while loading the {section} experience. Our team has been notified and will take a look.
      Please try again in a moment or contact support if the problem persists.
    </p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
    >
      Reload page
    </button>
  </div>
);

export function RouteSectionBoundary({ section, children }: RouteSectionBoundaryProps) {
  // Key the boundary by pathname so a crash on one page never bricks the whole
  // section: navigating remounts the boundary and gives the next route a clean
  // slate. Without this, one crashed page makes every sibling route show the
  // same error screen (the "every page is a 404" incident, Jul 23-24).
  const { pathname } = useLocation();
  return (
    <Sentry.ErrorBoundary
      key={pathname}
      fallback={<SectionFallback section={section} />}
      onError={(error) => {
        Sentry.captureException(error, {
          level: 'error',
          tags: { boundary: section },
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
