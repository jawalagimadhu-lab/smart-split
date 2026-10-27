import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/app/store';
import { authApi } from '@/services/api';
import type { User as UserType } from '@/types';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.display_name.trim()) e.display_name = 'Please enter your name.';
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username))
      e.username = 'Username must be 3–30 characters (letters, numbers, underscores).';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
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
      const res = await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        display_name: form.display_name,
      }) as { access_token: string; token_type: string; user: UserType };
      setUser(res.user, res.access_token);
      toast.success('Account created! Let\'s set up your workspace.');
      navigate('/onboarding');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo registration
  const handleDemoRegister = () => {
    const demoUser: UserType = {
      id: 'demo-user',
      username: 'demo',
      email: 'demo@smartsplit.app',
      display_name: 'Demo User',
      created_at: new Date().toISOString(),
      preferences: {
        jurisdiction: '',
        country: '',
        separation_stage: 'exploring',
        primary_goals: [],
        has_children: false,
        language: 'en',
        theme: 'light',
        notifications_enabled: true,
        onboarding_completed: false,
      },
    };
    setUser(demoUser, 'demo-token');
    toast.success('Demo account created!');
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-primary-text mt-6 mb-1">Create your account</h1>
          <p className="text-secondary-text text-sm">Set up your secure, private workspace</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-md p-8">
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 text-sm text-error animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Your name"
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              error={errors.display_name}
              placeholder="Alex"
              autoComplete="name"
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Username"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              error={errors.username}
              placeholder="alex_smith"
              autoComplete="username"
              leftIcon={<span className="text-secondary-text text-sm">@</span>}
            />

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
              placeholder="Create a strong password"
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-secondary-text hover:text-primary-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Password strength */}
            {form.password && (
              <div className="space-y-1 animate-fade-in">
                {PASSWORD_RULES.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${rule.test(form.password) ? 'bg-success' : 'bg-border'}`}>
                      {rule.test(form.password) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={rule.test(form.password) ? 'text-success' : 'text-secondary-text'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              error={errors.confirm_password}
              placeholder="Repeat your password"
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <p className="text-xs text-secondary-text">
              By creating an account, you agree that Smart Split is an educational and organizational tool
              and does not provide legal advice.
            </p>

            <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-secondary-text">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button type="button" variant="outline" size="md" fullWidth onClick={handleDemoRegister}>
            Continue with Demo Account
          </Button>
          <p className="text-xs text-secondary-text text-center mt-2">No backend required — uses sample data</p>
        </div>

        <p className="text-center text-sm text-secondary-text mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
