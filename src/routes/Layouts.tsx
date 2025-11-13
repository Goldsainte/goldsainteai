import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingFallback } from '@/components/LoadingFallback';
import { EnvironmentValidator } from '@/components/system/EnvironmentValidator';
import { RouteSectionBoundary } from './RouteSectionBoundary';

interface SuspensefulOutletProps {
  section: string;
  withEnvironment?: boolean;
}

const SuspensefulOutlet = ({ section, withEnvironment }: SuspensefulOutletProps) => (
  <RouteSectionBoundary section={section}>
    <Suspense fallback={<LoadingFallback />}>
      {withEnvironment ? <EnvironmentValidator /> : null}
      <Outlet />
    </Suspense>
  </RouteSectionBoundary>
);

export const MarketingLayout = () => <SuspensefulOutlet section="marketing" />;
export const AuthLayout = () => <SuspensefulOutlet section="auth" />;
export const MemberLayout = () => <SuspensefulOutlet section="member" withEnvironment />;
export const AdminLayout = () => <SuspensefulOutlet section="admin" />;
