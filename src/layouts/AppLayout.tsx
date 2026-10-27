import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Scale, FileText, DollarSign,
  Users, ListChecks, Heart, MessageSquare, Shield,
  Sunrise, BookOpen, Calendar, Settings, HelpCircle,
  Bell, ChevronLeft, ChevronRight, Menu, X, LogOut,
  Sun, Moon, Search
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore, useUIStore, useNotificationStore } from '@/app/store';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'ai', label: 'Smart Split AI', path: '/app/ai', icon: Bot },
  { id: 'legal', label: 'Legal Guide', path: '/app/legal', icon: Scale },
  { id: 'documents', label: 'Document Center', path: '/app/documents', icon: FileText },
  { id: 'finance', label: 'Financial Planner', path: '/app/finance', icon: DollarSign },
  { id: 'parenting', label: 'Parenting & Custody', path: '/app/parenting', icon: Users },
  { id: 'planner', label: 'Separation Planner', path: '/app/planner', icon: ListChecks },
  { id: 'wellbeing', label: 'Wellbeing Center', path: '/app/wellbeing', icon: Heart },
  { id: 'communication', label: 'Communication Hub', path: '/app/communication', icon: MessageSquare },
  { id: 'safety', label: 'Safety & Support', path: '/app/safety', icon: Shield },
  { id: 'life', label: 'Life After Divorce', path: '/app/life-after', icon: Sunrise },
  { id: 'resources', label: 'Resources Library', path: '/app/resources', icon: BookOpen },
  { id: 'calendar', label: 'Calendar', path: '/app/calendar', icon: Calendar },
];

const BOTTOM_NAV = [
  { id: 'notifications', label: 'Notifications', path: '/app/notifications', icon: Bell },
  { id: 'settings', label: 'Settings', path: '/app/settings', icon: Settings },
  { id: 'help', label: 'Help & Support', path: '/app/help', icon: HelpCircle },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, theme, toggleTheme } = useUIStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const displayName = user?.display_name || user?.username || 'User';
  const initials = displayName.split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('');

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={clsx(
      'flex flex-col h-full bg-white border-r border-border',
      !mobile && (sidebarCollapsed ? 'w-16' : 'w-64')
    )}>
      {/* Logo + collapse */}
      <div className={clsx(
        'flex items-center px-4 h-16 border-b border-border flex-shrink-0',
        sidebarCollapsed && !mobile ? 'justify-center' : 'justify-between'
      )}>
        {(!sidebarCollapsed || mobile) && <Logo size="sm" />}
        {sidebarCollapsed && !mobile && <Logo variant="icon" size="sm" />}
        {!mobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-secondary-text hover:bg-border hover:text-primary-text transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-secondary-text hover:bg-border">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive
                  ? 'bg-accent-50 text-accent'
                  : 'text-secondary-text hover:bg-background hover:text-primary-text',
                sidebarCollapsed && !mobile && 'justify-center px-0'
              )}
              title={sidebarCollapsed && !mobile ? item.label : undefined}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
              {(!sidebarCollapsed || mobile) && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Separator */}
        <div className="my-3 mx-2 h-px bg-border" />

        {/* Bottom nav */}
        <div className="space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => mobile && setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                isActive ? 'bg-accent-50 text-accent' : 'text-secondary-text hover:bg-background hover:text-primary-text',
                sidebarCollapsed && !mobile && 'justify-center px-0'
              )}
              title={sidebarCollapsed && !mobile ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {(!sidebarCollapsed || mobile) && <span className="truncate">{item.label}</span>}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className={clsx(
                  'flex-shrink-0 min-w-[18px] h-[18px] bg-error text-white text-xs rounded-full flex items-center justify-center px-1',
                  sidebarCollapsed && !mobile && 'absolute top-1 right-1 min-w-[14px] h-[14px] text-[10px]'
                )}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className={clsx(
        'p-3 border-t border-border flex-shrink-0',
        sidebarCollapsed && !mobile ? 'items-center justify-center flex flex-col gap-2' : ''
      )}>
        {(!sidebarCollapsed || mobile) ? (
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background transition-colors">
            <div className="w-8 h-8 bg-accent-100 text-accent rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-text truncate">{displayName}</p>
              <p className="text-xs text-secondary-text truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-secondary-text hover:bg-border hover:text-error transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 bg-accent-100 text-accent rounded-full flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-secondary-text hover:bg-border hover:text-error transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className={clsx(
        'hidden lg:flex flex-shrink-0 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 animate-slide-in">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile + global actions) */}
        <header className="h-14 bg-white border-b border-border flex items-center gap-3 px-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-secondary-text hover:bg-border"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-background rounded-xl px-3 py-2 border border-border">
            <Search className="w-4 h-4 text-secondary-text flex-shrink-0" />
            <input
              placeholder="Search Smart Split..."
              className="flex-1 text-sm bg-transparent outline-none text-primary-text placeholder:text-secondary-text"
            />
            <kbd className="text-xs text-secondary-text bg-white border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-secondary-text hover:bg-border hover:text-primary-text transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <Link to="/app/notifications" className="relative p-2 rounded-xl text-secondary-text hover:bg-border hover:text-primary-text transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </Link>

            {/* User avatar (mobile) */}
            <div className="lg:hidden w-8 h-8 bg-accent-100 text-accent rounded-full flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
