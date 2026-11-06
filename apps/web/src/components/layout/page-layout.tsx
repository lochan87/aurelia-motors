import { Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { ScrollToHash } from '../scroll-to-hash';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-ivory-50 px-5">
      <p
        role="status"
        className="text-[0.65rem] font-semibold tracking-[0.24em] text-stone-500 uppercase"
      >
        Loading the showroom…
      </p>
    </div>
  );
}

export function PageLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory-50">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-full bg-ivory-50 px-5 py-3 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <ScrollToHash />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<RouteLoading />}>{children ?? <Outlet />}</Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
