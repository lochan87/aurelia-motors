import { QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { PageLayout } from './components/layout/page-layout';
import { queryClient } from './lib/query-client';

const HomePage = lazy(() =>
  import('./pages/home-page').then((module) => ({ default: module.HomePage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/privacy-page').then((module) => ({ default: module.PrivacyPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/not-found-page').then((module) => ({ default: module.NotFoundPage })),
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route index element={<HomePage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
