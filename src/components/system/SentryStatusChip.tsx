import { useEffect, useState } from "react";

export function SentryStatusChip() {
  const [dsnSource, setDsnSource] = useState<'env' | 'fallback' | 'missing'>('missing');

  useEffect(() => {
    const checkDsnSource = () => {
      const envDsn = import.meta.env.VITE_SENTRY_DSN;
      const fallbackUsed = (window as any).__SENTRY_FALLBACK__;

      if (envDsn) {
        setDsnSource('env');
      } else if (fallbackUsed) {
        setDsnSource('fallback');
      } else {
        setDsnSource('missing');
      }
    };

    // Initial check
    checkDsnSource();

    // Listen for Sentry initialization
    const handleSentryInit = () => {
      checkDsnSource();
    };

    window.addEventListener('sentry-initialized', handleSentryInit);

    return () => {
      window.removeEventListener('sentry-initialized', handleSentryInit);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const statusConfig = {
    env: {
      label: 'Sentry: Env',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    fallback: {
      label: 'Sentry: Fallback',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    missing: {
      label: 'Sentry: Missing',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
  };

  const config = statusConfig[dsnSource];

  return (
    <div className={`px-3 py-1.5 ${config.bgColor} border ${config.borderColor} rounded-md shadow-sm`}>
      <p className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </p>
    </div>
  );
}
