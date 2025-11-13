import { ReactNode } from 'react';
import * as Sentry from '@sentry/react';

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
  return (
    <Sentry.ErrorBoundary
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
