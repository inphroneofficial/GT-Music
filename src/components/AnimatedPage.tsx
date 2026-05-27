import { useLocation } from 'react-router-dom';

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-enter h-full min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
