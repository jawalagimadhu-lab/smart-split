import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/app/store';

// ── Lazy-loaded pages ────────────────────────────────────────
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));

const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const AIAssistantPage = lazy(() => import('@/features/ai-assistant/AIAssistantPage'));
const LegalGuidePage = lazy(() => import('@/features/legal-guide/LegalGuidePage'));
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'));
const FinancialPlannerPage = lazy(() => import('@/features/finance/FinancialPlannerPage'));
const ParentingPage = lazy(() => import('@/features/parenting/ParentingPage'));
const SeparationPlannerPage = lazy(() => import('@/features/planner/SeparationPlannerPage'));
const WellbeingPage = lazy(() => import('@/features/wellbeing/WellbeingPage'));
const CommunicationPage = lazy(() => import('@/features/communication/CommunicationPage'));
const SafetyPage = lazy(() => import('@/features/safety/SafetyPage'));
const LifeAfterPage = lazy(() => import('@/features/life-after/LifeAfterPage'));
const ResourcesPage = lazy(() => import('@/features/resources/ResourcesPage'));
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

// ── Loading spinner ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-secondary-text">Loading Smart Split...</p>
      </div>
    </div>
  );
}

// ── Protected route ─────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

// ── Theme sync ───────────────────────────────────────────────
function ThemeSync() {
  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  return null;
}

// ── Forgot password page ─────────────────────────────────────
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-primary-text mb-2">Reset Password</h1>
        <p className="text-secondary-text text-sm mb-6">Enter your email and we'll send reset instructions.</p>
        {!sent ? (
          <div className="bg-white rounded-2xl border border-border shadow-md p-6 space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>
            <button
              onClick={() => setSent(true)}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-500 transition-colors"
            >
              Send Reset Link
            </button>
            <p className="text-xs text-secondary-text text-center">
              Note: Password reset requires a configured email service. This is a demo.
            </p>
          </div>
        ) : (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6">
            <p className="text-teal font-medium mb-1">Reset link submitted (demo mode)</p>
            <p className="text-xs text-teal-700">No email was actually sent. Connect a real backend to enable password resets.</p>
          </div>
        )}
        <Link to="/login" className="block mt-4 text-sm text-accent hover:underline">← Back to login</Link>
      </div>
    </div>
  );
}

// ── 404 page ─────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
      <div>
        <p className="text-7xl font-bold text-border mb-4">404</p>
        <h1 className="text-2xl font-bold text-primary-text mb-2">Page not found</h1>
        <p className="text-secondary-text mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-accent-500 transition-colors">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

// ── Root app ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Onboarding — requires auth */}
          <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

          {/* App — requires auth */}
          <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="ai" element={<AIAssistantPage />} />
            <Route path="legal" element={<LegalGuidePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="finance" element={<FinancialPlannerPage />} />
            <Route path="parenting" element={<ParentingPage />} />
            <Route path="planner" element={<SeparationPlannerPage />} />
            <Route path="wellbeing" element={<WellbeingPage />} />
            <Route path="communication" element={<CommunicationPage />} />
            <Route path="safety" element={<SafetyPage />} />
            <Route path="life-after" element={<LifeAfterPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
