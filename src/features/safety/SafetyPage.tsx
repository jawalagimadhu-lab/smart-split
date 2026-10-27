import { useState } from 'react';
import { Shield, Phone, CheckSquare, Square, AlertTriangle, ExternalLink, Eye, EyeOff, Lock } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SAFETY_CHECKLIST = [
  { id: 's1', text: 'I have a safe place to stay if needed', category: 'Immediate Safety' },
  { id: 's2', text: 'I have access to emergency funds (cash or separate account)', category: 'Immediate Safety' },
  { id: 's3', text: 'I have copies of important documents in a safe location', category: 'Documents' },
  { id: 's4', text: 'I have charged my phone and saved emergency contacts', category: 'Communication' },
  { id: 's5', text: 'I know how to contact local domestic violence support', category: 'Support' },
  { id: 's6', text: 'I have a trusted person I can contact in an emergency', category: 'Support' },
  { id: 's7', text: "I have considered who should have my children's school contacts", category: 'Children' },
  { id: 's8', text: 'I have considered changing passwords on personal accounts', category: 'Digital Safety' },
  { id: 's9', text: 'I am aware of how to browse privately if needed', category: 'Digital Safety' },
  { id: 's10', text: 'I have considered whether my location is visible on shared devices', category: 'Digital Safety' },
];

const ESSENTIAL_ITEMS = [
  'Passport or national ID', 'Birth certificates (yours and children\'s)', 'Marriage certificate',
  'Bank cards and cash', 'House keys and spare keys', 'Medication',
  'Insurance documents', 'Court documents (if any)', 'Children\'s comfort items',
  'Phone charger', 'Change of clothes', 'Important contact numbers written down',
];

const CRISIS_RESOURCES = [
  { country: 'United Kingdom', resources: [
    { name: 'National Domestic Abuse Helpline', contact: '0808 2000 247', url: 'https://www.nationaldahelpline.org.uk', available: '24/7' },
    { name: "Women's Aid", contact: 'Live chat available', url: 'https://www.womensaid.org.uk', available: '24/7' },
    { name: 'ManKind Initiative (men)', contact: '01823 334244', url: 'https://mankind.org.uk', available: 'Weekdays' },
    { name: 'Samaritans (crisis support)', contact: '116 123', url: 'https://www.samaritans.org', available: '24/7' },
  ]},
  { country: 'United States', resources: [
    { name: 'National Domestic Violence Hotline', contact: '1-800-799-7233', url: 'https://www.thehotline.org', available: '24/7' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741', url: 'https://www.crisistextline.org', available: '24/7' },
    { name: '988 Suicide & Crisis Lifeline', contact: '988', url: 'https://988lifeline.org', available: '24/7' },
  ]},
  { country: 'Australia', resources: [
    { name: '1800RESPECT', contact: '1800 737 732', url: 'https://www.1800respect.org.au', available: '24/7' },
    { name: 'Safe Steps (Victoria)', contact: '1800 015 188', url: 'https://www.safesteps.org.au', available: '24/7' },
    { name: 'Beyond Blue', contact: '1300 22 4636', url: 'https://www.beyondblue.org.au', available: '24/7' },
  ]},
];

export default function SafetyPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [devicesVisible, setDevicesVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');

  const toggleItem = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const checklistByCategory = SAFETY_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof SAFETY_CHECKLIST>);

  const countryResources = CRISIS_RESOURCES.find(c => c.country === selectedCountry)?.resources ?? [];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Safety & Support</h1>
          <p className="text-secondary-text mt-1 text-sm">Discreet, practical safety resources and crisis support.</p>
        </div>
        {/* Quick exit */}
        <Button
          variant="danger"
          size="sm"
          leftIcon={<ExternalLink className="w-4 h-4" />}
          onClick={() => window.location.replace('https://www.google.com')}
        >
          Quick Exit
        </Button>
      </div>

      {/* Quick exit explanation */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
        <p className="text-xs font-medium text-error mb-1">About Quick Exit</p>
        <p className="text-xs text-red-700">
          The Quick Exit button takes you to Google immediately. <strong>It does not clear your browser history or hide your network activity.</strong>
          For better privacy, use your browser's private/incognito mode when accessing Smart Split.
        </p>
      </div>

      {/* Emergency contacts */}
      <Card className="border-red-100 bg-red-50">
        <CardHeader><CardTitle subtitle="Call emergency services immediately if you are in danger">Emergency Services</CardTitle></CardHeader>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'United Kingdom', number: '999' },
            { label: 'United States', number: '911' },
            { label: 'Australia', number: '000' },
          ].map(({ label, number }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-red-100">
              <Phone className="w-4 h-4 text-error flex-shrink-0" />
              <div>
                <p className="text-xs text-secondary-text">{label}</p>
                <p className="text-lg font-bold text-error">{number}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Crisis resources */}
      <Card>
        <CardHeader>
          <CardTitle subtitle="Verified crisis and domestic abuse support resources">Crisis Support Resources</CardTitle>
        </CardHeader>
        <div className="flex gap-2 mb-4 flex-wrap">
          {CRISIS_RESOURCES.map(c => (
            <button key={c.country} onClick={() => setSelectedCountry(c.country)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', selectedCountry === c.country ? 'bg-accent text-white border-accent' : 'bg-white border-border text-secondary-text hover:border-accent-200')}>
              {c.country}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {countryResources.map(r => (
            <div key={r.name} className="flex items-start gap-3 p-3.5 bg-background rounded-xl border border-border">
              <Phone className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-primary-text">{r.name}</p>
                <p className="text-sm text-accent font-medium mt-0.5">{r.contact}</p>
                <p className="text-xs text-secondary-text">{r.available}</p>
              </div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded-lg text-secondary-text hover:text-accent transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border">
          Resources verified at time of publication. Contact details may change — always verify through official websites. Smart Split does not invent or guarantee the accuracy of these numbers.
        </p>
      </Card>

      {/* Safety checklist */}
      <Card>
        <CardHeader>
          <CardTitle subtitle={`${checked.size} of ${SAFETY_CHECKLIST.length} items reviewed`}>Personal Safety Checklist</CardTitle>
        </CardHeader>
        <p className="text-xs text-secondary-text mb-4">This checklist is for personal reflection only — not a legal or official safety plan. Consider working with a domestic abuse specialist for a comprehensive safety plan.</p>
        {Object.entries(checklistByCategory).map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="text-xs font-semibold text-secondary-text uppercase tracking-wide mb-2">{category}</p>
            <div className="space-y-2">
              {items.map(item => (
                <button key={item.id} onClick={() => toggleItem(item.id)} className={clsx('w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all', checked.has(item.id) ? 'bg-teal-50 border-teal-100' : 'bg-background border-border hover:border-accent-200')}>
                  {checked.has(item.id) ? <CheckSquare className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-border flex-shrink-0 mt-0.5" />}
                  <span className={clsx('text-sm', checked.has(item.id) ? 'text-teal-700' : 'text-primary-text')}>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Essential items */}
      <Card>
        <CardHeader><CardTitle subtitle="Items to have ready if you need to leave quickly">Essential Items to Prepare</CardTitle></CardHeader>
        <div className="grid sm:grid-cols-2 gap-2">
          {ESSENTIAL_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border text-sm text-primary-text">
              <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </Card>

      {/* Digital safety */}
      <Card>
        <CardHeader
          action={<button onClick={() => setDevicesVisible(!devicesVisible)} className="flex items-center gap-1 text-xs text-secondary-text hover:text-accent"><>{devicesVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}<span>{devicesVisible ? 'Hide' : 'Show'}</span></></button>}
        >
          <CardTitle subtitle="Protecting your digital privacy">Digital Safety Guidance</CardTitle>
        </CardHeader>
        {devicesVisible && (
          <div className="space-y-3 animate-fade-in">
            {[
              { title: 'Use Private Browsing', desc: 'Use incognito/private mode when accessing Smart Split so your browsing history is not saved on the device.' },
              { title: 'Check Location Sharing', desc: 'Review whether your location is being shared on any device, app, or account accessible to another person.' },
              { title: 'Review Account Access', desc: 'Check which shared devices have access to your email, banking, and other important accounts.' },
              { title: 'Change Passwords', desc: 'Consider changing passwords on important personal accounts to ones that are not shared or known by others.' },
              { title: 'Check Cloud Backups', desc: 'If using shared cloud accounts (iCloud, Google Drive), check whether your data is visible to others.' },
            ].map(item => (
              <div key={item.title} className="flex gap-2.5 p-3 bg-background rounded-xl border border-border">
                <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-text">{item.title}</p>
                  <p className="text-xs text-secondary-text mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
