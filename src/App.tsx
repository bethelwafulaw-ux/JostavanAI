import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import APIKeysPage from '@/pages/APIKeysPage';
import VibeCoderPage from '@/pages/VibeCoderPage';
import DocsPage from '@/pages/DocsPage';
import UsagePage from '@/pages/UsagePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        }
      />
      <Route
        path="/api-keys"
        element={
          <AppLayout>
            <APIKeysPage />
          </AppLayout>
        }
      />
      <Route
        path="/vibecoder"
        element={
          <AppLayout>
            <VibeCoderPage />
          </AppLayout>
        }
      />
      <Route
        path="/docs"
        element={
          <AppLayout>
            <DocsPage />
          </AppLayout>
        }
      />
      <Route
        path="/usage"
        element={
          <AppLayout>
            <UsagePage />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  );
}
