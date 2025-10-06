/**
 * Screen reader announcement component for loading states
 * Improves accessibility for visually impaired users
 */
export const LoadingAnnouncement = ({ message }: { message: string }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * Screen reader announcement for errors
 */
export const ErrorAnnouncement = ({ message }: { message: string }) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
