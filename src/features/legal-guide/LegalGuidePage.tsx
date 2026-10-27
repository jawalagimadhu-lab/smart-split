import { useState } from 'react';
import { Search, BookOpen, BookmarkPlus, Bookmark, ChevronRight, Clock, Tag } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useResourceStore } from '@/app/store';
import { LEGAL_GUIDE_TOPICS } from '@/utils/sampleData';

const CATEGORIES = ['All', 'Divorce Basics', 'Property Division', 'Child Custody', 'Mediation', 'Spousal Support'];

const GLOSSARY = [
  { term: 'Petitioner', definition: 'The spouse who files the divorce application.' },
  { term: 'Respondent', definition: 'The spouse who receives and responds to the divorce petition.' },
  { term: 'Uncontested Divorce', definition: 'Both parties agree on all matters including property, children, and support.' },
  { term: 'Contested Divorce', definition: 'Parties disagree on one or more issues, potentially requiring a court hearing.' },
  { term: 'Decree Absolute / Divorce Order', definition: 'The final court order that legally ends the marriage.' },
  { term: 'Matrimonial Home', definition: 'The property where the family lived together.' },
  { term: 'Financial Remedy', definition: 'A court order dealing with financial matters on divorce.' },
  { term: 'Parenting Plan', definition: 'A written agreement between parents about how they will raise their children post-separation.' },
  { term: 'Mediation', definition: 'A voluntary process where a neutral third party helps separating couples reach agreement.' },
  { term: 'MIAM', definition: 'Mediation Information and Assessment Meeting — required in England & Wales before most family court applications.' },
];

export default function LegalGuidePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'glossary'>('topics');
  const { bookmarks, toggleBookmark } = useResourceStore();

  const filtered = LEGAL_GUIDE_TOPICS.filter((t) => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeTopic = LEGAL_GUIDE_TOPICS.find((t) => t.id === activeTopicId);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-text">Legal Guide</h1>
        <p className="text-secondary-text mt-1 text-sm">
          Educational legal information — not legal advice. Always verify with a qualified solicitor or attorney.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex items-start gap-2.5">
        <span className="text-warning text-sm">⚠️</span>
        <p className="text-xs text-amber-800">
          This content is for general educational purposes only. Laws and procedures vary significantly between
          countries and regions. This information may not reflect the most recent changes. Always consult a
          qualified legal professional for advice specific to your situation.
        </p>
      </div>

      {!activeTopic ? (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-background rounded-xl border border-border mb-5 w-fit">
            {(['topics', 'glossary'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                  activeTab === t ? 'bg-white text-accent shadow-sm border border-border' : 'text-secondary-text hover:text-primary-text'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'topics' ? (
            <>
              {/* Search + filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search legal topics..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={clsx(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
                      category === cat ? 'bg-accent text-white border-accent' : 'bg-white text-secondary-text border-border hover:border-accent-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyState icon={<BookOpen className="w-6 h-6" />} title="No results found" description="Try a different search term or category." />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((topic) => (
                    <Card
                      key={topic.id}
                      hover
                      className="cursor-pointer"
                      onClick={() => setActiveTopicId(topic.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="accent">{topic.category}</Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id); }}
                          className="p-1 rounded-lg text-secondary-text hover:text-accent transition-colors"
                        >
                          {bookmarks.includes(topic.id) ? <Bookmark className="w-4 h-4 text-accent" /> : <BookmarkPlus className="w-4 h-4" />}
                        </button>
                      </div>
                      <h3 className="font-semibold text-primary-text mb-2">{topic.title}</h3>
                      <p className="text-xs text-secondary-text line-clamp-2 mb-3">
                        {topic.content.split('\n')[0].replace(/[#*]/g, '')}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-secondary-text">
                          <Clock className="w-3 h-3" />
                          {topic.reading_time} min read
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary-text" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Glossary */
            <div className="space-y-2">
              {GLOSSARY.map((item) => (
                <div key={item.term} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-primary-text text-sm">{item.term}</span>
                      <p className="text-sm text-secondary-text mt-0.5">{item.definition}</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-secondary-text text-center pt-2">
                Legal terminology varies by jurisdiction. These are general definitions only.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Article view */
        <div className="max-w-3xl">
          <button
            onClick={() => setActiveTopicId(null)}
            className="flex items-center gap-1.5 text-sm text-secondary-text hover:text-accent mb-5 transition-colors"
          >
            ← Back to Legal Guide
          </button>
          <Card>
            <div className="flex items-start justify-between mb-4">
              <Badge variant="accent">{activeTopic.category}</Badge>
              <button
                onClick={() => toggleBookmark(activeTopic.id)}
                className="p-1.5 rounded-lg text-secondary-text hover:text-accent transition-colors"
              >
                {bookmarks.includes(activeTopic.id) ? <Bookmark className="w-4 h-4 text-accent" /> : <BookmarkPlus className="w-4 h-4" />}
              </button>
            </div>
            <h1 className="text-xl font-bold text-primary-text mb-2">{activeTopic.title}</h1>
            <div className="flex items-center gap-3 text-xs text-secondary-text mb-6">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activeTopic.reading_time} min read</span>
              <Badge variant="neutral">General information</Badge>
            </div>

            <div className="prose-sm space-y-3 text-sm text-primary-text leading-relaxed">
              {activeTopic.content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**'))
                  return <p key={i} className="font-semibold text-primary-text mt-4">{line.replace(/\*\*/g, '')}</p>;
                if (line.startsWith('- '))
                  return <li key={i} className="ml-4 list-disc text-secondary-text">{line.slice(2)}</li>;
                if (!line.trim()) return null;
                return <p key={i} className="text-secondary-text">{line}</p>;
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border bg-amber-50 rounded-xl p-3.5 -mx-6 -mb-6">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> This article is for general educational purposes only and does not constitute legal advice.
                Laws and procedures vary by jurisdiction and may have changed. Always consult a qualified legal professional.
              </p>
            </div>
          </Card>

          <div className="mt-4">
            <h3 className="font-medium text-primary-text mb-3 text-sm">Questions to ask your lawyer</h3>
            <div className="space-y-2">
              {['How does this apply in my specific jurisdiction?', 'What are the likely timelines in my situation?', 'What documentation will I need to provide?', 'What are the costs involved?'].map((q) => (
                <div key={q} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-border text-sm text-secondary-text">
                  <span className="text-accent">?</span>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
