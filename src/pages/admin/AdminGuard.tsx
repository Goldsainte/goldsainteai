import { ReactNode } from 'react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

type Props = {
  children: ReactNode;
};

export function AdminGuard({ children }: Props) {
  const { checking, allowed } = useRequireAdmin();

  if (checking) {
    return (
      <main className="min-h-screen bg-[#0a2225] flex items-center justify-center">
        <p className="text-[12px] text-[#E5DFC6]/80">Checking access…</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#0a2225] flex items-center justify-center">
        <p className="text-[12px] text-red-300">
          You don't have permission to view this page.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
