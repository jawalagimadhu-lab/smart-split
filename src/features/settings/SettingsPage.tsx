import { useState } from 'react';
import { User, Globe, Palette, Bell, Shield, Database, Trash2, Download, LogOut, Check, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useAuthStore, useUIStore } from '@/app/store';
import { getStageLabel } from '@/utils/helpers';

type Section = 'profile' | 'jurisdiction' | 'appearance' | 'notifications' | 'privacy' | 'data';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'jurisdiction', label: 'Jurisdiction & Language', icon: <Globe className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'data', label: 'Data & Account', icon: <Database className="w-4 h-4" /> },
];

const STAGES = [
  { value: 'exploring', label: 'Exploring options' },
  { value: 'considering', label: 'Considering separation' },
  { value: 'recently_separated', label: 'Recently separated' },
  { value: 'preparing_divorce', label: 'Preparing for divorce' },
  { value: 'proceedings_underway', label: 'Proceedings underway' },
  { value: 'finalizing', label: 'Finalizing arrangements' },
  { value: 'rebuilding', label: 'Rebuilding after divorce' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [section, setSection] = useState<Section>('profile');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const prefs = user?.preferences;

  const [profileForm, setProfileForm] = useState({
    display_name: user?.display_name ?? '',
    email: user?.email ?? '',
  });
  const [prefForm, setPrefForm] = useState({
    country: prefs?.country ?? '',
    jurisdiction: prefs?.jurisdiction ?? '',
    separation_stage: prefs?.separation_stage ?? 'exploring',
    language: prefs?.language ?? 'en',
    has_children: prefs?.has_children ?? false,
    notifications_enabled: prefs?.notifications_enabled ?? true,
  });

  const handleSave = () => {
    updateUser({
      display_name: profileForm.display_name,
      preferences: {
        ...prefs!,
        ...prefForm,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Settings saved');
  };

  const handleExport = () => {
    const data = { user, preferences: prefs, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-split-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleDeleteAccount = () => {
    logout();
    toast.success('Account data cleared');
    navigate('/');
  };

  const renderSection = () => {
    switch (section) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-accent-100 text-accent rounded-full flex items-center justify-center text-xl font-bold">
                {(profileForm.display_name[0] ?? 'U').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-primary-text">{profileForm.display_name || 'User'}</p>
                <p className="text-sm text-secondary-text">{profileForm.email}</p>
              </div>
            </div>
            <Input label="Display name" value={profileForm.display_name} onChange={e => setProfileForm({ ...profileForm, display_name: e.target.value })} placeholder="Your preferred name" />
            <Input label="Email address" type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} hint="Used for account recovery only." />
          </div>
        );

      case 'jurisdiction':
        return (
          <div className="space-y-4">
            <Input label="Country" value={prefForm.country} onChange={e => setPrefForm({ ...prefForm, country: e.target.value })} placeholder="e.g. United Kingdom" />
            <Input label="Region / Jurisdiction" value={prefForm.jurisdiction} onChange={e => setPrefForm({ ...prefForm, jurisdiction: e.target.value })} placeholder="e.g. England & Wales" hint="Helps Smart Split show the most relevant information." />
            <Select label="Current stage" value={prefForm.separation_stage} onChange={e => setPrefForm({ ...prefForm, separation_stage: e.target.value as typeof prefForm.separation_stage })}
              options={STAGES} />
            <Select label="Language" value={prefForm.language} onChange={e => setPrefForm({ ...prefForm, language: e.target.value })}
              options={[{ value: 'en', label: 'English' }]} hint="More languages coming soon." />
            <label className="flex items-center gap-2 text-sm text-primary-text cursor-pointer">
              <input type="checkbox" checked={prefForm.has_children} onChange={e => setPrefForm({ ...prefForm, has_children: e.target.checked })} className="rounded" />
              I have children (show parenting tools)
            </label>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-primary-text mb-3">Theme</p>
              <div className="grid grid-cols-2 gap-3">
                {(['light', 'dark'] as const).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={clsx('p-4 rounded-xl border-2 flex items-center gap-3 transition-all', theme === t ? 'border-accent bg-accent-50' : 'border-border hover:border-accent-200 bg-white')}>
                    {t === 'light' ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-accent" />}
                    <div className="text-left">
                      <p className="text-sm font-medium capitalize text-primary-text">{t}</p>
                      <p className="text-xs text-secondary-text">{t === 'light' ? 'Default' : 'Easier on the eyes'}</p>
                    </div>
                    {theme === t && <Check className="w-4 h-4 text-accent ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-background rounded-xl border border-border cursor-pointer hover:border-accent-200 transition-colors">
              <div>
                <p className="text-sm font-medium text-primary-text">Enable notifications</p>
                <p className="text-xs text-secondary-text">Receive reminders for tasks, deadlines, and events</p>
              </div>
              <div className={clsx('w-10 h-6 rounded-full transition-colors relative cursor-pointer', prefForm.notifications_enabled ? 'bg-accent' : 'bg-border')}
                onClick={() => setPrefForm(f => ({ ...f, notifications_enabled: !f.notifications_enabled }))}>
                <div className={clsx('absolute top-1 w-4 h-4 rounded-full bg-white transition-all', prefForm.notifications_enabled ? 'left-5' : 'left-1')} />
              </div>
            </label>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <p className="text-xs text-amber-800">Smart Split uses in-app notifications only. We do not send SMS or push notifications by default. Email notifications require backend configuration.</p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            {[
              { title: 'Local AI Processing', desc: 'AI conversations are processed by Ollama running locally. Conversations are not sent to cloud AI services.' },
              { title: 'Data Storage', desc: 'Your data is stored in your browser\'s local storage and on the Smart Split backend (when configured). It is not shared with third parties.' },
              { title: 'Document Privacy', desc: 'Uploaded documents are not sent to any AI service without your explicit action.' },
              { title: 'No Advertising', desc: 'Smart Split does not use advertising or sell user data.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-4 bg-background rounded-xl border border-border">
                <Shield className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-text">{item.title}</p>
                  <p className="text-xs text-secondary-text mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-secondary-text">For a full privacy policy, visit the Privacy section on the Smart Split website.</p>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <Card>
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-primary-text mb-1">Export Your Data</h3>
                  <p className="text-xs text-secondary-text mb-3">Download a copy of your profile and preferences. Note: uploaded documents are not included in this export.</p>
                  <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>Export Data (JSON)</Button>
                </div>
              </div>
            </Card>
            <Card className="border-red-100">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-primary-text mb-1">Delete Account</h3>
                  <p className="text-xs text-secondary-text mb-3">This will clear all your data from this device. In a full deployment, this would also delete server-side data. This action cannot be undone.</p>
                  <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete My Account</Button>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-text">Settings</h1>
        <p className="text-secondary-text mt-1 text-sm">Manage your profile, preferences, and account.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={clsx('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left', section === s.id ? 'bg-accent-50 text-accent' : 'text-secondary-text hover:bg-border hover:text-primary-text')}>
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{SECTIONS.find(s => s.id === section)?.label}</CardTitle>
            </CardHeader>
            {renderSection()}
            {section !== 'data' && (
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="primary" onClick={handleSave} leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}>
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
                {saved && <span className="text-xs text-success">Changes saved successfully.</span>}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteAccount} title="Delete Account" message="This will permanently delete your account and all associated data. This cannot be undone. Are you sure?" confirmLabel="Delete My Account" cancelLabel="Cancel" danger />
    </div>
  );
}
