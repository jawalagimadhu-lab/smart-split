import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, Shield, Brain, FileText, DollarSign,
  Heart, Users, ArrowRight, Check, Star, Menu, X,
  Lock, Sparkles, Calendar, BookOpen, MessageSquare
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Resources', href: '#resources' },
];

const FEATURES = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI Divorce Assistant',
    description: 'Get clear, compassionate answers to complex questions — powered by a private local AI model that stays on your device.',
    color: 'accent',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Document Center',
    description: 'Organize, store, and review your important documents with smart categorization and AI-assisted summaries.',
    color: 'teal',
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Financial Planner',
    description: 'Build a realistic post-separation budget, track assets and debts, and plan scenarios for your financial future.',
    color: 'accent',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Parenting & Custody Hub',
    description: 'Create parenting schedules, track expenses, and organize co-parenting logistics — independently or together.',
    color: 'teal',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Separation Planner',
    description: 'A personalized, stage-by-stage action plan built around your situation — not a generic one-size-fits-all checklist.',
    color: 'accent',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Wellbeing Center',
    description: 'Private journaling, daily mood check-ins, breathing exercises, and compassionate reflections to support your mental health.',
    color: 'teal',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Communication Hub',
    description: 'Draft calm, neutral messages with AI tone assistance. Keep records of important communications organized.',
    color: 'accent',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Legal Guide',
    description: 'A searchable library of legal education resources, glossaries, and checklists — clearly labeled for your jurisdiction.',
    color: 'teal',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your secure account',
    description: 'Sign up in minutes. Your data is stored securely and never shared. All AI processing happens locally on your device.',
  },
  {
    step: '02',
    title: 'Tell us where you are',
    description: 'Answer a few simple questions about your situation and stage of separation. Smart Split personalizes everything to fit your needs.',
  },
  {
    step: '03',
    title: 'Organize your workspace',
    description: 'Upload documents, build your budget, create tasks, and access your personalized action plan — all in one place.',
  },
  {
    step: '04',
    title: 'Get AI-powered guidance',
    description: 'Ask questions, get plain-language explanations, draft messages, and plan your next steps with an always-available AI assistant.',
  },
];

const FAQS = [
  {
    q: 'Is Smart Split a substitute for a lawyer?',
    a: 'No. Smart Split provides educational information and organizational tools, not legal advice. We strongly encourage you to work with a qualified family law solicitor or attorney for any consequential legal decisions. Smart Split helps you prepare, organize, and understand — not replace professional legal counsel.',
  },
  {
    q: 'Is my data private?',
    a: 'Your privacy is central to Smart Split. The AI assistant runs locally using Ollama — your conversations are never sent to third-party cloud AI services. Your documents and personal information are stored securely and only accessible to you.',
  },
  {
    q: 'What if I have children?',
    a: 'Smart Split includes a dedicated Parenting & Custody Hub for users with children. You can create proposed parenting schedules, track expenses, and organize events. All tools clearly distinguish between personal proposals and legally approved arrangements.',
  },
  {
    q: 'Can I use Smart Split without involving my spouse?',
    a: 'Absolutely. Smart Split is designed to support you as an individual. You can use every feature independently without your spouse or partner being involved at any stage.',
  },
  {
    q: 'What countries does Smart Split support?',
    a: 'Smart Split is designed for international use. You select your country and jurisdiction during onboarding, and information is presented with appropriate regional context. Legal content is clearly labeled as general education, not jurisdiction-specific legal advice.',
  },
  {
    q: 'Is Smart Split free?',
    a: 'Smart Split is designed to run locally without subscription fees when you host it yourself. It uses Ollama, a free and open-source local AI runtime, so there are no ongoing AI API costs.',
  },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary-text" id="home">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-secondary-text hover:text-primary-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-secondary-text hover:bg-border"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-border animate-slide-up">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-secondary-text hover:text-primary-text py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" size="sm" fullWidth>Sign In</Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button variant="primary" size="sm" fullWidth>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-accent-50 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered · Private · Locally Hosted
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-text leading-tight tracking-tight mb-6">
              Your next chapter
              <br />
              <span className="text-accent">starts with clarity.</span>
            </h1>

            <p className="text-lg text-secondary-text leading-relaxed mb-8 max-w-lg">
              Navigate separation and divorce with practical guidance, organized documents,
              financial clarity, and support designed around your needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Get Started — It's Free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['No AI API costs', 'Your data stays private', 'No legal advice claims'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-secondary-text">
                  <Check className="w-3.5 h-3.5 text-success" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="animate-slide-up">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-text mb-4">How Smart Split Works</h2>
            <p className="text-secondary-text max-w-xl mx-auto">
              A structured, private workspace that helps you move forward — step by step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-50 text-accent font-bold text-lg rounded-2xl mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-primary-text mb-2">{step.title}</h3>
                <p className="text-sm text-secondary-text leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-text mb-4">
              Everything you need in one place
            </h2>
            <p className="text-secondary-text max-w-xl mx-auto">
              Smart Split brings legal education, document management, financial planning,
              and emotional support into a single secure workspace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
                  feature.color === 'accent' ? 'bg-accent-50 text-accent' : 'bg-teal-50 text-teal'
                )}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-primary-text mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary-text leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAGES ─────────────────────────────────────────── */}
      <section className="py-20 bg-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary-text mb-4">
                Support for wherever you are right now
              </h2>
              <p className="text-secondary-text mb-8 leading-relaxed">
                Whether you're just beginning to explore your options or rebuilding your life after divorce,
                Smart Split adapts to your stage and meets you where you are.
              </p>
              <div className="space-y-3">
                {[
                  'Exploring options',
                  'Considering separation',
                  'Recently separated',
                  'Preparing for divorce',
                  'Proceedings underway',
                  'Finalizing arrangements',
                  'Rebuilding after divorce',
                ].map((stage) => (
                  <div key={stage} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-sm text-primary-text">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-primary-text">Smart Split AI</span>
                <span className="ml-auto text-xs bg-teal-50 text-teal px-2 py-0.5 rounded-full">Connected</span>
              </div>
              <div className="space-y-3">
                {[
                  { role: 'user', msg: 'What should I do first when separating?' },
                  { role: 'ai', msg: 'A good starting point is to organize your important documents and understand your financial situation. I can help you create a personalized checklist. Where are you located?' },
                  { role: 'user', msg: 'I\'m in the UK' },
                  { role: 'ai', msg: 'Great. In England and Wales, divorce proceedings typically begin with a divorce application. Let\'s start by organizing your documents — shall I create a checklist for you?' },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'flex',
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm',
                        m.role === 'user'
                          ? 'bg-accent text-white'
                          : 'bg-background border border-border text-primary-text'
                      )}
                    >
                      {m.msg}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY ────────────────────────────────────────── */}
      <section id="privacy" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-text mb-4">
              Privacy is not an afterthought
            </h2>
            <p className="text-secondary-text max-w-xl mx-auto">
              Your separation involves sensitive personal, legal, and financial information.
              Smart Split is designed from the ground up with your privacy in mind.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-5 h-5" />,
                title: 'Local AI Processing',
                description: 'The AI assistant runs entirely on your device using Ollama. Your conversations are never sent to third-party AI cloud services.',
              },
              {
                icon: <Lock className="w-5 h-5" />,
                title: 'Secure by Design',
                description: 'Data is encrypted in transit. Authentication uses secure, hashed credentials. User data is isolated and never mixed with other accounts.',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Your Data, Your Control',
                description: 'Export your data at any time. Request deletion of your account and associated data. No advertising, no data monetization.',
              },
              {
                icon: <Star className="w-5 h-5" />,
                title: 'Minimal Data Collection',
                description: 'We collect only what is necessary to provide the service. No tracking pixels, third-party analytics, or unnecessary third-party scripts.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Independent Access',
                description: 'Use Smart Split without your spouse or partner ever knowing. Your account and workspace are entirely private to you.',
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: 'Sensitive Document Protection',
                description: 'Uploaded documents are processed locally and are not sent to external AI services without your explicit consent and knowledge.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-background border border-border">
                <div className="w-10 h-10 bg-accent-50 text-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-primary-text text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-secondary-text leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESOURCES TEASER ───────────────────────────────── */}
      <section id="resources" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-text mb-4">Educational Resources</h2>
            <p className="text-secondary-text max-w-xl mx-auto">
              Access a curated library of guides, checklists, and articles to help you understand your situation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Understanding the Divorce Process', cat: 'Legal', color: 'accent' },
              { title: 'Financial Checklist for Separation', cat: 'Finance', color: 'teal' },
              { title: 'Parenting Through Separation', cat: 'Parenting', color: 'teal' },
              { title: 'Spousal Support Explained', cat: 'Legal', color: 'accent' },
              { title: 'Managing Stress During Divorce', cat: 'Wellbeing', color: 'peach' },
              { title: 'Property Division Overview', cat: 'Legal', color: 'accent' },
            ].map((r) => (
              <Link
                key={r.title}
                to="/register"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:shadow-sm hover:border-accent-200 transition-all group"
              >
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  r.color === 'accent' ? 'bg-accent-50 text-accent' : r.color === 'teal' ? 'bg-teal-50 text-teal' : 'bg-peach-100 text-amber-700'
                )}>
                  {r.cat[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-text truncate">{r.title}</p>
                  <p className="text-xs text-secondary-text">{r.cat}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-secondary-text group-hover:text-accent transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/register">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Access Full Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-text mb-4">Frequently Asked Questions</h2>
            <p className="text-secondary-text">Honest answers to common questions.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-background transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-primary-text text-sm">{faq.q}</span>
                  <ChevronDown
                    className={clsx(
                      'w-4 h-4 text-secondary-text transition-transform flex-shrink-0 ml-4',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-secondary-text leading-relaxed border-t border-border pt-4 bg-background animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 bg-accent">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start your next chapter?
          </h2>
          <p className="text-accent-100 text-lg mb-8 max-w-xl mx-auto">
            Create your free account and get organized with a private, compassionate AI-powered workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-accent hover:bg-accent-50"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Get Started — Free
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-accent-200">
            Smart Split is an educational and organizational tool. It does not provide legal advice.
            Please consult a qualified legal professional for advice specific to your situation.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-primary-text text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" light className="mb-3" />
              <p className="text-xs leading-relaxed text-white/50">
                A clearer path to your next chapter. AI-powered divorce and separation support.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-xs">
                {['Dashboard', 'AI Assistant', 'Documents', 'Financial Planner', 'Resources'].map(item => (
                  <li key={item}><Link to="/register" className="hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-xs">
                {['About', 'Privacy Policy', 'Terms of Use', 'Contact', 'Help'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-3">Important Disclaimers</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                Smart Split provides general educational information only. It does not provide legal,
                financial, or psychological advice. Always consult qualified professionals for decisions
                affecting your legal rights.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs">© 2026 Smart Split. All rights reserved.</p>
            <p className="text-xs text-white/40">For educational and organizational use only. Not legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard Preview Component ─────────────────────────────
function DashboardPreview() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-xl overflow-hidden">
      {/* Top bar */}
      <div className="bg-primary-text px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>
        <div className="flex-1 bg-white/10 rounded-md h-5 mx-2" />
        <Logo size="sm" light />
      </div>

      {/* Content */}
      <div className="flex h-72">
        {/* Sidebar */}
        <div className="w-12 bg-background border-r border-border flex flex-col items-center py-3 gap-2.5">
          {['#8A7AE6', '#5AAE9A', '#C58A37', '#5AAE9A', '#8A7AE6'].map((c, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-lg"
              style={{ background: i === 0 ? c : `${c}30` }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-32 bg-primary-text/80 rounded mb-1" />
              <div className="h-2 w-24 bg-border rounded" />
            </div>
            <div className="bg-accent-50 text-accent text-xs px-2 py-1 rounded-full font-medium">
              Stage 2
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: '7', l: 'Tasks', c: 'bg-accent-50 text-accent' },
              { v: '3', l: 'Docs', c: 'bg-teal-50 text-teal' },
              { v: '68%', l: 'Progress', c: 'bg-green-50 text-success' },
            ].map((s) => (
              <div key={s.l} className="bg-background rounded-lg p-2 border border-border">
                <div className={`text-sm font-bold ${s.c.split(' ')[1]}`}>{s.v}</div>
                <div className="text-xs text-secondary-text">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="space-y-1.5">
            {[
              { t: 'Gather financial documents', done: false, p: 'high' },
              { t: 'Open a personal bank account', done: true, p: 'medium' },
              { t: 'Schedule lawyer consultation', done: false, p: 'high' },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border">
                <div className={clsx('w-3.5 h-3.5 rounded flex-shrink-0 border', task.done ? 'bg-success border-success' : 'border-border bg-white')} />
                <span className={clsx('text-xs flex-1 truncate', task.done && 'line-through text-secondary-text')}>
                  {task.t}
                </span>
                <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', task.p === 'high' ? 'bg-accent-50 text-accent' : 'bg-border text-secondary-text')}>
                  {task.p}
                </span>
              </div>
            ))}
          </div>

          {/* AI preview */}
          <div className="bg-accent-50 rounded-lg p-2.5 border border-accent-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium text-accent">Smart Split AI</span>
            </div>
            <div className="h-2 w-full bg-accent-100 rounded mb-1" />
            <div className="h-2 w-3/4 bg-accent-100 rounded" />
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-accent-50 border-t border-accent-100 text-center">
        <span className="text-xs text-accent font-medium">✦ Sample data for illustration only</span>
      </div>
    </div>
  );
}
