import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/app/store';
import { authApi } from '@/services/api';
import type { User } from '@/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await authApi.login({ email: form.email, password: form.password }) as {
        access_token: string; token_type: string; user: User;
      };
      setUser(res.user, res.access_token);
      toast.success(`Welcome back, ${res.user.display_name || res.user.username}!`);
      navigate('/app/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo login — uses local sample data without backend
  const handleDemoLogin = () => {
    const demoUser: User = {
      id: 'demo-user',
      username: 'demo',
      email: 'demo@smartsplit.app',
      display_name: 'Alex (Demo)',
      created_at: new Date().toISOString(),
      preferences: {
        jurisdiction: 'England & Wales',
        country: 'United Kingdom',
        separation_stage: 'recently_separated',
        primary_goals: ['organize_documents', 'understand_process', 'financial_planning'],
        has_children: true,
        language: 'en',
        theme: 'light',
        notifications_enabled: true,
        onboarding_completed: true,
      },
    };
    setUser(demoUser, 'demo-token');
    toast.success('Signed in to demo account');
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-primary-text mt-6 mb-1">Welcome back</h1>
          <p className="text-secondary-text text-sm">Sign in to your secure workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-md p-8">
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 text-sm text-error animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="Your password"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-secondary-text hover:text-primary-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-secondary-text">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo mode */}
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={handleDemoLogin}
          >
            Try Demo Account
          </Button>

          <p className="text-xs text-secondary-text text-center mt-3">
            Demo mode uses sample data. No backend required.
          </p>
        </div>

        <p className="text-center text-sm text-secondary-text mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
