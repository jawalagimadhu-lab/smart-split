import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, Search, Grid, List, Star, Trash2,
  Download, File, Image, AlertCircle, CheckCircle2, Loader2,
  Plus, Brain, ChevronDown, ChevronRight, Copy, Check,
  RefreshCw, Layers
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { useDocumentStore, useAuthStore } from '@/app/store';
import { documentsApi, chatApi } from '@/services/api';
import { useBackendSync } from '@/hooks/useBackendSync';
import { DEMO_DOCUMENTS } from '@/utils/sampleData';
import { formatDate, formatFileSize } from '@/utils/helpers';
import type { Document, DocumentCategory } from '@/types';

// ── Extended document type (includes indexing) ───────────────
interface DocWithIndex extends Document {
  index_status?: 'not_indexed' | 'indexing' | 'indexed' | 'error';
  index_chunk_count?: number;
}

const CATEGORIES: { value: DocumentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Documents' },
  { value: 'identification', label: 'Identification' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'financial', label: 'Financial' },
  { value: 'income', label: 'Income' },
  { value: 'property', label: 'Property' },
  { value: 'debt', label: 'Debts' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'court', label: 'Court' },
  { value: 'agreements', label: 'Agreements' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' },
];

const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};
const MAX_SIZE = 25 * 1024 * 1024;

const INTEL_OPS = [
  { id: 'summarize', label: 'Summarize', icon: '📄' },
  { id: 'extract_dates', label: 'Extract Dates', icon: '📅' },
  { id: 'extract_parties', label: 'Named Parties', icon: '👤' },
  { id: 'terminology', label: 'Explain Terms', icon: '🔍' },
  { id: 'lawyer_questions', label: 'Questions for Lawyer', icon: '⚖️' },
];

function getFileIcon(type: string) {
  if (type === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (type === 'docx' || type === 'doc') return <FileText className="w-5 h-5 text-blue-500" />;
  if (['jpg', 'jpeg', 'png'].includes(type)) return <Image className="w-5 h-5 text-teal" />;
  return <File className="w-5 h-5 text-secondary-text" />;
}

function IndexBadge({ status }: { status?: string }) {
  if (!status || status === 'not_indexed') return null;
  if (status === 'indexing') return <Badge variant="accent" dot>Indexing…</Badge>;
  if (status === 'indexed') return <Badge variant="success" dot>Indexed</Badge>;
  if (status === 'error') return <Badge variant="error" dot>Index error</Badge>;
  return null;
}

export default function DocumentsPage() {
  const { token } = useAuthStore();
  const { documents, setDocuments, addDocument, updateDocument, removeDocument } = useDocumentStore();
  const isDemo = !token || token === 'demo-token';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('other');
  const [uploading, setUploading] = useState(false);

  // Document Intelligence panel
  const [intelDocId, setIntelDocId] = useState<string | null>(null);
  const [intelOp, setIntelOp] = useState('summarize');
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelResult, setIntelResult] = useState<{ result: string; disclaimer: string } | null>(null);
  const [intelReviewed, setIntelReviewed] = useState(false);
  const [textExcerpt, setTextExcerpt] = useState('');

  // Sync with backend on mount
  const { loading: syncLoading } = useBackendSync<Document>({
    fetcher: (t) => documentsApi.list(t) as Promise<Document[]>,
    onSuccess: (data) => setDocuments(data),
    hasData: documents.length > 0,
    skipIfPopulated: false, // always refresh from backend
  });

  // Use demo data if no backend
  const allDocs: DocWithIndex[] = isDemo && documents.length === 0 ? DEMO_DOCUMENTS : documents;

  const filtered = allDocs.filter(d => {
    const matchCat = category === 'all' || d.category === category;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const onDrop = useCallback((accepted: File[], rejected: { file: File }[]) => {
    if (rejected.length > 0) {
      toast.error('Some files rejected. Max 25 MB. Accepted: PDF, DOCX, TXT, JPG, PNG.');
    }
    setUploadedFiles(prev => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    setUploading(true);

    for (const file of uploadedFiles) {
      try {
        if (isDemo) {
          // Demo mode: local only
          const ext = file.name.split('.').pop()?.toLowerCase() ?? 'other';
          const doc: Document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            user_id: 'demo',
            name: file.name,
            original_name: file.name,
            category: uploadCategory,
            tags: [],
            file_type: ext,
            file_size: file.size,
            status: 'ready',
            is_favorite: false,
            upload_date: new Date().toISOString(),
          };
          addDocument(doc);
        } else {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('category', uploadCategory);
          const doc = await documentsApi.upload(fd, token!) as Document;
          addDocument(doc);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(`Failed to upload "${file.name}": ${msg}`);
      }
    }

    toast.success(`${uploadedFiles.length} document${uploadedFiles.length !== 1 ? 's' : ''} uploaded`);
    setUploadedFiles([]);
    setUploadOpen(false);
    setUploading(false);
  };

  const handleDownload = async (doc: Document) => {
    if (isDemo) {
      toast('Download not available in demo mode.', { icon: 'ℹ️' });
      return;
    }
    try {
      await documentsApi.download(doc.id, doc.original_name || doc.name, token!);
    } catch (err: unknown) {
      toast.error('Download failed.');
    }
  };

  const handleDelete = async (id: string) => {
    removeDocument(id);
    if (!isDemo) {
      try { await documentsApi.delete(id, token!); } catch { /* already removed locally */ }
    }
    toast.success('Document deleted');
  };

  const handleFavorite = async (doc: Document) => {
    updateDocument(doc.id, { is_favorite: !doc.is_favorite });
    if (!isDemo) {
      try { await documentsApi.update(doc.id, { is_favorite: !doc.is_favorite }, token!); } catch {}
    }
  };

  const handleIndexDocument = async (doc: Document) => {
    if (isDemo) { toast('Indexing requires backend connection.', { icon: 'ℹ️' }); return; }
    if (!['pdf', 'txt', 'docx'].includes(doc.file_type)) {
      toast.error(`Indexing not supported for .${doc.file_type} files.`); return;
    }
    updateDocument(doc.id, { status: 'indexing' } as Partial<Document>);
    try {
      await documentsApi.indexDocument(doc.id, token!);
      toast.success('Indexing started — check status in a moment');
      // Poll status after 3s
      setTimeout(async () => {
        try {
          const st = await documentsApi.indexStatus(doc.id, token!);
          updateDocument(doc.id, { status: st.status === 'indexed' ? 'ready' : 'ready' } as Partial<Document>);
        } catch {}
      }, 3000);
    } catch (err: unknown) {
      updateDocument(doc.id, { status: 'ready' } as Partial<Document>);
      toast.error('Indexing failed.');
    }
  };

  const handleIntel = async () => {
    if (!intelDocId || !textExcerpt.trim()) {
      toast.error('Paste some document text first.'); return;
    }
    if (isDemo) { toast('AI analysis requires backend connection.', { icon: 'ℹ️' }); return; }
    setIntelLoading(true);
    setIntelResult(null);
    setIntelReviewed(false);
    try {
      const result = await chatApi.documentIntel(
        { document_id: intelDocId, operation: intelOp, text_excerpt: textExcerpt },
        token!
      );
      setIntelResult({ result: result.result, disclaimer: result.disclaimer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(msg);
    } finally {
      setIntelLoading(false);
    }
  };

  const intelDoc = allDocs.find(d => d.id === intelDocId);

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Document Center</h1>
          <p className="text-secondary-text mt-0.5 text-sm">
            {allDocs.length} document{allDocs.length !== 1 ? 's' : ''} in your workspace
            {isDemo && ' · Demo mode'}
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setUploadOpen(true)}>
          Upload
        </Button>
      </div>

      {/* Privacy notice */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teal-700">
          Your documents are stored securely. AI analysis is only performed when you explicitly request it
          and paste text yourself — documents are never automatically sent to the AI.
        </p>
      </div>

      {/* Search + view controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={clsx('p-2.5 rounded-xl border transition-all', view === 'list' ? 'bg-accent text-white border-accent' : 'bg-white border-border text-secondary-text')}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('grid')} className={clsx('p-2.5 rounded-xl border transition-all', view === 'grid' ? 'bg-accent text-white border-accent' : 'bg-white border-border text-secondary-text')}>
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              category === cat.value ? 'bg-accent text-white border-accent' : 'bg-white text-secondary-text border-border hover:border-accent-200'
            )}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {syncLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No documents yet"
          description="Upload your important documents to keep them organized in one secure place."
          action={<Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>Upload Your First Document</Button>} />
      ) : view === 'list' ? (
        <div className="space-y-2">
          {filtered.map(doc => (
            <DocumentRow key={doc.id} doc={doc}
              onFavorite={() => handleFavorite(doc)}
              onDelete={() => setDeleteId(doc.id)}
              onDownload={() => handleDownload(doc)}
              onIndex={() => handleIndexDocument(doc)}
              onIntel={() => { setIntelDocId(doc.id); setIntelResult(null); setTextExcerpt(''); }}
              intelActive={intelDocId === doc.id}
            />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc}
              onFavorite={() => handleFavorite(doc)}
              onDelete={() => setDeleteId(doc.id)}
              onDownload={() => handleDownload(doc)}
            />
          ))}
        </div>
      )}

      {/* ── Document Intelligence Panel ────────────────────── */}
      {intelDocId && intelDoc && (
        <div className="bg-accent-50 border border-accent-100 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm text-primary-text">AI Document Analysis</span>
              <Badge variant="accent">{intelDoc.name}</Badge>
            </div>
            <button onClick={() => { setIntelDocId(null); setIntelResult(null); }}
              className="text-xs text-secondary-text hover:text-primary-text">✕ Close</button>
          </div>

          {/* Operation selector */}
          <div className="flex gap-2 flex-wrap">
            {INTEL_OPS.map(op => (
              <button key={op.id} onClick={() => setIntelOp(op.id)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5',
                  intelOp === op.id ? 'bg-accent text-white border-accent' : 'bg-white text-secondary-text border-border hover:border-accent-200'
                )}>
                {op.icon} {op.label}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div>
            <label className="block text-xs font-medium text-primary-text mb-1.5">
              Paste text from your document (max 8,000 characters):
            </label>
            <textarea
              value={textExcerpt}
              onChange={e => setTextExcerpt(e.target.value.slice(0, 8000))}
              placeholder="Copy and paste the relevant section of your document here…"
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-accent-200 bg-white text-sm text-primary-text resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-secondary-text">
                You control what text is sent to the AI. Review before submitting.
              </p>
              <span className="text-xs text-secondary-text">{textExcerpt.length}/8000</span>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleIntel} loading={intelLoading}
            leftIcon={<Brain className="w-4 h-4" />} disabled={!textExcerpt.trim()}>
            {intelLoading ? 'Analysing…' : 'Analyse with AI'}
          </Button>

          {/* Result */}
          {intelResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-white rounded-xl border border-accent-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                    {INTEL_OPS.find(o => o.id === intelOp)?.label} Result
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(intelResult.result); toast.success('Copied'); }}
                    className="flex items-center gap-1 text-xs text-secondary-text hover:text-accent">
                    <Copy className="w-3 h-3" />Copy
                  </button>
                </div>
                <div className="text-sm text-primary-text whitespace-pre-wrap leading-relaxed">
                  {intelResult.result}
                </div>
              </div>

              {/* Disclaimer + review gate */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-800">{intelResult.disclaimer}</p>
              </div>
              <label className="flex items-start gap-2 cursor-pointer text-sm text-primary-text">
                <input type="checkbox" checked={intelReviewed} onChange={e => setIntelReviewed(e.target.checked)} className="mt-0.5 rounded" />
                <span>I have reviewed this AI-generated analysis and understand it may contain errors.</span>
              </label>
              {intelReviewed && (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  You can now save or use this information. Always verify important facts independently.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadOpen} onClose={() => { setUploadOpen(false); setUploadedFiles([]); }} title="Upload Documents" size="lg">
        <div className="space-y-4">
          <div {...getRootProps()} className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragActive ? 'border-accent bg-accent-50' : 'border-border hover:border-accent-200 bg-background'
          )}>
            <input {...getInputProps()} />
            <Upload className={clsx('w-8 h-8 mx-auto mb-3', isDragActive ? 'text-accent' : 'text-secondary-text')} />
            <p className="text-sm font-medium text-primary-text mb-1">
              {isDragActive ? 'Drop files here…' : 'Drag files here or click to browse'}
            </p>
            <p className="text-xs text-secondary-text">PDF, DOCX, TXT, JPG, PNG up to 25 MB each</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-background rounded-xl border border-border">
                  {getFileIcon(file.name.split('.').pop() ?? '')}
                  <span className="flex-1 text-sm text-primary-text truncate">{file.name}</span>
                  <span className="text-xs text-secondary-text">{formatFileSize(file.size)}</span>
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-secondary-text hover:text-error transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Document category</label>
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
              {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {isDemo && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
              Demo mode: files will be stored locally in your browser only. Connect the backend for real file storage.
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setUploadOpen(false); setUploadedFiles([]); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpload} loading={uploading} disabled={uploadedFiles.length === 0}>
              Upload {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) handleDelete(deleteId); }}
        title="Delete Document" message="Delete this document? This cannot be undone." confirmLabel="Delete" danger />
    </div>
  );
}

// ── Row & Card sub-components ────────────────────────────────
interface DocActionProps {
  doc: DocWithIndex;
  onFavorite: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onIndex?: () => void;
  onIntel?: () => void;
  intelActive?: boolean;
}

function DocumentRow({ doc, onFavorite, onDelete, onDownload, onIndex, onIntel, intelActive }: DocActionProps) {
  const [showActions, setShowActions] = useState(false);
  return (
    <div className={clsx('flex items-center gap-3 p-3.5 bg-white rounded-xl border transition-all group',
      intelActive ? 'border-accent-200 shadow-sm' : 'border-border hover:shadow-sm')}>
      <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
        {getFileIcon(doc.file_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-text truncate">{doc.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-secondary-text">{formatDate(doc.upload_date)} · {formatFileSize(doc.file_size)}</p>
          <IndexBadge status={doc.index_status} />
        </div>
      </div>
      <Badge variant="neutral" className="flex-shrink-0">
        {CATEGORIES.find(c => c.value === doc.category)?.label ?? doc.category}
      </Badge>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onFavorite} className={clsx('p-1.5 rounded-lg transition-colors', doc.is_favorite ? 'text-warning' : 'text-secondary-text hover:text-warning hover:bg-border')} title="Favourite">
          <Star className={clsx('w-3.5 h-3.5', doc.is_favorite && 'fill-warning')} />
        </button>
        <button onClick={onDownload} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border transition-colors" title="Download">
          <Download className="w-3.5 h-3.5" />
        </button>
        {onIntel && ['pdf', 'docx', 'txt'].includes(doc.file_type) && (
          <button onClick={onIntel} className={clsx('p-1.5 rounded-lg transition-colors', intelActive ? 'text-accent bg-accent-50' : 'text-secondary-text hover:text-accent hover:bg-border')} title="AI Analysis">
            <Brain className="w-3.5 h-3.5" />
          </button>
        )}
        {onIndex && ['pdf', 'docx', 'txt'].includes(doc.file_type) && (
          <button onClick={onIndex} className="p-1.5 rounded-lg text-secondary-text hover:text-teal hover:bg-border transition-colors" title="Index for AI Search">
            <Layers className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border transition-colors" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function DocumentCard({ doc, onFavorite, onDelete, onDownload }: DocActionProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center">
          {getFileIcon(doc.file_type)}
        </div>
        <button onClick={onFavorite} className={clsx('p-1.5 rounded-lg transition-colors', doc.is_favorite ? 'text-warning' : 'text-secondary-text hover:text-warning')}>
          <Star className={clsx('w-4 h-4', doc.is_favorite && 'fill-warning')} />
        </button>
      </div>
      <h3 className="text-sm font-medium text-primary-text truncate mb-1">{doc.name}</h3>
      <p className="text-xs text-secondary-text mb-3">{formatDate(doc.upload_date)} · {formatFileSize(doc.file_size)}</p>
      <IndexBadge status={doc.index_status} />
      <div className="flex items-center justify-between mt-3">
        <Badge variant="neutral">
          {CATEGORIES.find(c => c.value === doc.category)?.label ?? doc.category}
        </Badge>
        <div className="flex gap-1">
          <button onClick={onDownload} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
