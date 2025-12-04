import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingFallback } from '@/components/LoadingFallback';
import { RouteSectionBoundary } from './RouteSectionBoundary';

interface SuspensefulOutletProps {
  section: string;
}

const SuspensefulOutlet = ({ section }: SuspensefulOutletProps) => (
  <RouteSectionBoundary section={section}>
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  </RouteSectionBoundary>
);

export const MarketingLayout = () => <SuspensefulOutlet section="marketing" />;
export const AuthLayout = () => <SuspensefulOutlet section="auth" />;
export const MemberLayout = () => <SuspensefulOutlet section="member" />;
export const AdminLayout = () => <SuspensefulOutlet section="admin" />;
