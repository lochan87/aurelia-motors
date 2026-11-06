import { QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/protected-route';
import { PageLayout } from './components/layout/page-layout';
import { StaffLayout } from './components/layout/staff-layout';
import { AuthProvider } from './lib/auth-context';
import { queryClient } from './lib/query-client';

const HomePage = lazy(() =>
  import('./pages/home-page').then((module) => ({ default: module.HomePage })),
);
const VehiclesPage = lazy(() =>
  import('./pages/vehicles-page').then((module) => ({ default: module.VehiclesPage })),
);
const VehicleDetailPage = lazy(() =>
  import('./pages/vehicle-detail-page').then((module) => ({ default: module.VehicleDetailPage })),
);
const CertifiedPage = lazy(() =>
  import('./pages/certified-page').then((module) => ({ default: module.CertifiedPage })),
);
const CertifiedDetailPage = lazy(() =>
  import('./pages/certified-detail-page').then((module) => ({
    default: module.CertifiedDetailPage,
  })),
);
const PrivacyPage = lazy(() =>
  import('./pages/privacy-page').then((module) => ({ default: module.PrivacyPage })),
);
const TestDrivePage = lazy(() =>
  import('./pages/test-drive-page').then((module) => ({ default: module.TestDrivePage })),
);
const ServiceBookingPage = lazy(() =>
  import('./pages/service-booking-page').then((module) => ({ default: module.ServiceBookingPage })),
);
const BookingConfirmationPage = lazy(() =>
  import('./pages/booking-confirmation-page').then((module) => ({
    default: module.BookingConfirmationPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/not-found-page').then((module) => ({ default: module.NotFoundPage })),
);

// Staff Portal Pages
const StaffLoginPage = lazy(() =>
  import('./pages/staff/staff-login-page').then((module) => ({ default: module.StaffLoginPage })),
);
const StaffDashboardPage = lazy(() =>
  import('./pages/staff/staff-dashboard-page').then((module) => ({
    default: module.StaffDashboardPage,
  })),
);
const StaffAppointmentsPage = lazy(() =>
  import('./pages/staff/staff-appointments-page').then((module) => ({
    default: module.StaffAppointmentsPage,
  })),
);
const AdminStaffPage = lazy(() =>
  import('./pages/staff/admin-staff-page').then((module) => ({
    default: module.AdminStaffPage,
  })),
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Dealership Website */}
            <Route element={<PageLayout />}>
              <Route index element={<HomePage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="vehicles/:slug" element={<VehicleDetailPage />} />
              <Route path="test-drive" element={<TestDrivePage />} />
              <Route path="service" element={<ServiceBookingPage />} />
              <Route
                path="bookings/confirmation/:reference"
                element={<BookingConfirmationPage />}
              />
              <Route path="certified" element={<CertifiedPage />} />
              <Route path="certified/:slug" element={<CertifiedDetailPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
            </Route>

            {/* Staff Portal Authentication */}
            <Route path="staff/login" element={<StaffLoginPage />} />

            {/* Protected Staff Operations */}
            <Route element={<ProtectedRoute />}>
              <Route element={<StaffLayout />}>
                <Route path="staff" element={<StaffDashboardPage />} />
                <Route path="staff/dashboard" element={<StaffDashboardPage />} />
                <Route path="staff/appointments" element={<StaffAppointmentsPage />} />
                {/* Admin Only Clearance */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="staff/team" element={<AdminStaffPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
