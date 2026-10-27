import { useState } from 'react';
import { HelpCircle, Search, ChevronDown, MessageSquare, Send, CheckCircle2, Bot, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';

const FAQS = [
  { q: 'Is Smart Split a replacement for a lawyer?', a: 'No. Smart Split is an educational and organizational tool. It provides general information to help you understand your situation, organize your documents, and plan your next steps. All legal decisions should be made with qualified legal advice specific to your jurisdiction.' },
  { q: 'How does the AI assistant work?', a: 'The AI assistant uses Ollama to run a Mistral language model locally on your computer. This means your conversations are not sent to third-party cloud AI services. If Ollama is not installed, the assistant runs in demo mode with predefined educational responses.' },
  { q: 'Is my data secure?', a: 'Your data is stored locally in your browser and, when the backend is configured, on a local server. It is never sold, shared with advertisers, or sent to external AI services without your knowledge. See Settings > Privacy for more details.' },
  { q: 'Can I use Smart Split without my spouse knowing?', a: 'Yes. Smart Split is designed for individual use. You can use every feature without your spouse or partner being involved. Consider using private/incognito browser mode for additional privacy.' },
  { q: 'What happens to my data if I delete my account?', a: 'When you delete your account from Settings > Data & Account, all data is cleared from your device. In a full deployment, a complete deletion request would also remove server-side data.' },
  { q: 'Why does the AI sometimes say "I\'m not sure" or "consult a professional"?', a: 'The AI is designed to be honest about uncertainty. Divorce laws vary widely between countries, change frequently, and applying them to individual situations requires professional judgment. Overstating certainty about legal matters could cause real harm.' },
  { q: 'Can I use Smart Split on mobile?', a: 'Yes. Smart Split is fully responsive and works on mobile browsers. The sidebar navigation adapts to a drawer-style menu on smaller screens.' },
  { q: 'How do I set up the AI with Ollama?', a: 'Install Ollama from ollama.com. Then run "ollama pull mistral" to download the Mistral model. Start the Smart Split backend with "uvicorn main:app --reload", then start the frontend with "npm run dev". The AI status panel in the assistant page shows connection status.' },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', type: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredFaqs = FAQS.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!contactForm.message.trim()) { toast.error('Please enter a message.'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setSubmitting(false);
    toast.success('Message submitted (demo mode)');
  };

  return (
    <div className="page-container space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary-text">Help & Support</h1>
        <p className="text-secondary-text mt-1 text-sm">Find answers, get started guides, and contact support.</p>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-lg font-semibold text-primary-text mb-4">Frequently Asked Questions</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
        <div className="space-y-2">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-background transition-colors">
                <span className="font-medium text-sm text-primary-text">{faq.q}</span>
                <ChevronDown className={clsx('w-4 h-4 text-secondary-text transition-transform flex-shrink-0 ml-4', openFaq === i && 'rotate-180')} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-secondary-text leading-relaxed border-t border-border pt-3 bg-background animate-fade-in">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI limitations */}
      <Card>
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-primary-text mb-2">AI Assistant Limitations</h3>
            <div className="space-y-1.5 text-xs text-secondary-text">
              {[
                'Provides general educational information only — not legal advice.',
                'May not reflect the most recent changes to laws in your jurisdiction.',
                'Cannot verify facts, access court systems, or contact legal professionals.',
                'Should not be the basis for consequential legal decisions.',
                'May occasionally generate incorrect information — always verify with qualified sources.',
                'Does not have access to your uploaded documents unless you explicitly share content with it.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />{item}</div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Contact form */}
      <div>
        <h2 className="text-lg font-semibold text-primary-text mb-4">Contact Support</h2>
        {submitted ? (
          <Card>
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="font-semibold text-primary-text mb-1">Message submitted</h3>
              <p className="text-sm text-secondary-text">Thank you. In demo mode, this message was not actually sent to a support team. Connect a real support backend to enable this feature.</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setSubmitted(false); setContactForm({ name: '', email: '', type: 'general', message: '' }); }}>Send Another</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                <strong>Demo mode:</strong> Contact form submissions are not delivered to a real support team. Connect a backend email service to enable this feature.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Your name" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Alex" />
                <Input label="Email" type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <Select label="Type" value={contactForm.type} onChange={e => setContactForm({ ...contactForm, type: e.target.value })}
                options={[
                  { value: 'general', label: 'General question' },
                  { value: 'technical', label: 'Technical issue' },
                  { value: 'feedback', label: 'Feedback / suggestion' },
                  { value: 'privacy', label: 'Privacy question' },
                  { value: 'report', label: 'Report a problem' },
                ]} />
              <Textarea label="Message" value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Describe your question or issue..." rows={4} />
              <Button variant="primary" onClick={handleSubmit} loading={submitting} leftIcon={<Send className="w-4 h-4" />}>Send Message</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
