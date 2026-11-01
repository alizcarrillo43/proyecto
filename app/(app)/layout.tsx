import { AppSidebar } from '@/components/app-sidebar';
import { RequireSession } from '@/components/require-session';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession>
      <div className="min-h-screen bg-brand-mist">
        <AppSidebar />
        <div className="pb-24 md:pb-0 md:pl-64">{children}</div>
      </div>
    </RequireSession>
  );
}
