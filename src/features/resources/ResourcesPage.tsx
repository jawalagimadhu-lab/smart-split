import { useState } from 'react';
import { BookOpen, Search, Bookmark, BookmarkPlus, ExternalLink, Filter, Clock } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useResourceStore } from '@/app/store';
import { DEMO_RESOURCES } from '@/utils/sampleData';

const CATEGORIES = ['All', 'Legal', 'Finance', 'Parenting', 'Wellbeing', 'Safety', 'Life After'];

const TYPE_COLORS: Record<string, string> = {
  guide: 'accent',
  article: 'teal',
  checklist: 'peach',
  external: 'neutral',
};

export default function ResourcesPage() {
  const { bookmarks, toggleBookmark, addRecentlyViewed, recentlyViewed } = useResourceStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showBookmarks, setShowBookmarks] = useState(false);

  const resources = DEMO_RESOURCES.map(r => ({ ...r, bookmarked: bookmarks.includes(r.id) }));

  const filtered = resources.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || r.category === category;
    const matchBookmark = !showBookmarks || r.bookmarked;
    return matchSearch && matchCat && matchBookmark;
  });

  const recent = resources.filter(r => recentlyViewed.includes(r.id)).slice(0, 3);

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-text">Resources Library</h1>
        <p className="text-secondary-text mt-1 text-sm">Curated educational resources for every stage of separation. All content is clearly labeled — general information only.</p>
      </div>

      {/* Recently viewed */}
      {recent.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-secondary-text mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Recently Viewed</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {recent.map(r => (
              <div key={r.id} className="flex-shrink-0 w-48 p-3 bg-white rounded-xl border border-border hover:shadow-sm cursor-pointer" onClick={() => addRecentlyViewed(r.id)}>
                <Badge variant={TYPE_COLORS[r.type] as 'accent' | 'teal' | 'peach' | 'neutral'} className="mb-2">{r.type}</Badge>
                <p className="text-xs font-medium text-primary-text line-clamp-2">{r.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all', showBookmarks ? 'bg-accent text-white border-accent' : 'bg-white border-border text-secondary-text hover:border-accent-200')}
        >
          <Bookmark className="w-4 h-4" />
          Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={clsx('px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all', category === cat ? 'bg-accent text-white border-accent' : 'bg-white text-secondary-text border-border hover:border-accent-200')}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-6 h-6" />} title="No resources found" description="Try a different search term or category." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <div
              key={resource.id}
              className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { addRecentlyViewed(resource.id); toast(`"${resource.title}" — ${resource.category}`, { icon: '📖' }); }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant={TYPE_COLORS[resource.type] as 'accent' | 'teal' | 'peach' | 'neutral'}>{resource.type}</Badge>
                <button
                  onClick={e => { e.stopPropagation(); toggleBookmark(resource.id); toast.success(resource.bookmarked ? 'Bookmark removed' : 'Bookmarked'); }}
                  className="p-1 rounded-lg text-secondary-text hover:text-accent transition-colors"
                >
                  {resource.bookmarked ? <Bookmark className="w-4 h-4 text-accent" /> : <BookmarkPlus className="w-4 h-4" />}
                </button>
              </div>
              <h3 className="font-semibold text-sm text-primary-text mb-1.5">{resource.title}</h3>
              <p className="text-xs text-secondary-text mb-3 line-clamp-2">{resource.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-text">{resource.category}</span>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-accent flex items-center gap-1 hover:underline">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> All resources are for general educational purposes only. Smart Split does not verify the accuracy of external websites. 
          Always verify information with official sources and consult qualified professionals for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}
