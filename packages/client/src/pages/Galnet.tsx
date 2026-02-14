import { useEffect, useState, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloBadge from '../components/common/HoloBadge';

interface GalnetArticle {
  id: string;
  title: string;
  body: string;
  date: string;
  image: string | null;
}

export default function Galnet() {
  const { data: articles, loading, fetch: load } = useApi<GalnetArticle[]>('/galnet');
  const [selected, setSelected] = useState<GalnetArticle | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadArticles = useCallback(() => { load(); }, [load]);

  useEffect(() => {
    loadArticles();
    const t = setInterval(loadArticles, 60000); // Refresh article list every 60 seconds
    return () => clearInterval(t);
  }, [loadArticles]);

  const refresh = async () => {
    setRefreshing(true);
    setRefreshCount(null);
    try {
      const res = await apiFetch<{ count: number }>('/galnet/refresh', { method: 'POST' });
      setRefreshCount(res.count);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const viewArticle = async (article: GalnetArticle) => {
    setArticleLoading(true);
    try {
      const full = await apiFetch<GalnetArticle>(`/galnet/${encodeURIComponent(article.id)}`);
      setSelected(full);
    } catch {
      // Fallback to the list-level data if individual fetch fails
      setSelected(article);
    } finally {
      setArticleLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const now = Date.now();
      const then = new Date(dateStr).getTime();
      const diffMs = now - then;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 30) return '';
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      return 'Just now';
    } catch {
      return '';
    }
  };

  // Strip HTML tags from body content for plain-text rendering
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Generate a short excerpt from the body
  const getExcerpt = (body: string, maxLen = 150) => {
    const text = stripHtml(body);
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
  };

  // Filter articles by search term
  const filteredArticles = (articles || []).filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return a.title.toLowerCase().includes(term) || stripHtml(a.body).toLowerCase().includes(term);
  });

  if (!articles && loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading GalNet news...</p>
      </div>
    );
  }

  // Article detail view
  if (selected) {
    const bodyText = stripHtml(selected.body);
    return (
      <div className="page">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>GALNET NEWS</h1>
        <HoloPanel title={selected.title}>
          <div style={{ marginBottom: 16 }}>
            <HoloButton onClick={() => setSelected(null)}>Back to Feed</HoloButton>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {formatDate(selected.date)}
            </span>
            {formatRelativeTime(selected.date) && (
              <HoloBadge variant="info">{formatRelativeTime(selected.date)}</HoloBadge>
            )}
          </div>

          {selected.image && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={selected.image}
                alt={selected.title}
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: '1px solid var(--color-border)',
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--color-text-muted)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-body, inherit)',
          }}>
            {bodyText}
          </div>

          <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              ID: {selected.id.substring(0, 16)}...
            </span>
            <HoloButton onClick={() => setSelected(null)}>Back to Feed</HoloButton>
          </div>
        </HoloPanel>
      </div>
    );
  }

  // Feed list view
  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8 }}>GALNET NEWS</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
        The latest news and stories from across the galaxy, sourced from the official GalNet feed.
      </p>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <HoloButton onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Feed'}
        </HoloButton>
        {refreshCount != null && (
          <HoloBadge variant="success">{refreshCount} articles loaded</HoloBadge>
        )}
        <div style={{ flex: 1 }} />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter articles..."
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: '#fff',
            padding: '6px 12px',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            width: 250,
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {articleLoading && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>Loading article...</p>
      )}

      {/* Articles list */}
      {filteredArticles.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredArticles.map((article) => (
            <HoloPanel key={article.id || article.title} title="">
              <div
                onClick={() => viewArticle(article)}
                style={{ cursor: 'pointer', padding: '4px 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 16,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-accent-bright)',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}>
                      {article.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {formatDate(article.date)}
                      </span>
                      {formatRelativeTime(article.date) && (
                        <HoloBadge variant="info">{formatRelativeTime(article.date)}</HoloBadge>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      {getExcerpt(article.body)}
                    </div>
                  </div>
                  {article.image && (
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={article.image}
                        alt=""
                        style={{
                          width: 120,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid var(--color-border)',
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 8, letterSpacing: 0.5 }}>
                  READ MORE &rarr;
                </div>
              </div>
            </HoloPanel>
          ))}
        </div>
      ) : (
        <HoloPanel title="No Articles">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            {searchTerm
              ? `No articles match "${searchTerm}". Try a different search term.`
              : 'No articles available. Click "Refresh Feed" to fetch the latest GalNet news.'}
          </p>
        </HoloPanel>
      )}
    </div>
  );
}
