import React, { useEffect, useState } from 'react';
import NewsCard from '@/features/citizen/components/NewsCard';
interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string; // ISO
  thumbnail?: string;
  verified?: 'who' | 'moh' | null;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const WHO_RSS = 'https://www.who.int/rss-feeds/mediacentre/news/en/rss.xml';
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search?q=Ethiopia+health&hl=en-US&gl=US&ceid=US:en';

function parseRss(xmlText: string): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item'));
    return items.map((it, idx) => {
      const title = it.querySelector('title')?.textContent || 'Untitled';
      const link = it.querySelector('link')?.textContent || '';
      const pubDate = it.querySelector('pubDate')?.textContent || new Date().toISOString();
      const enclosure = it.querySelector('enclosure')?.getAttribute('url') || undefined;
      const source = it.querySelector('source')?.textContent || (link ? new URL(link).hostname : 'news');

      return {
        id: `${link || title}-${idx}`,
        title,
        source,
        date: new Date(pubDate).toISOString(),
        thumbnail: enclosure,
        verified: source.toLowerCase().includes('who') ? 'who' : source.toLowerCase().includes('ministry') ? 'moh' : null,
      } as NewsItem;
    });
  } catch (e) {
    return [];
  }
}

export default function HealthNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchFeeds() {
      setLoading(true);
      setError(null);
      try {
        const endpoints = [WHO_RSS, GOOGLE_NEWS_RSS];
        const results: NewsItem[] = [];

        await Promise.all(
          endpoints.map(async (url) => {
            try {
              const res = await fetch(CORS_PROXY + encodeURIComponent(url));
              if (!res.ok) return;
              const text = await res.text();
              const parsed = parseRss(text);
              results.push(...parsed);
            } catch (e) {
              // ignore per-feed errors
            }
          })
        );

        // sort by date desc and dedupe by id
        const deduped = results
          .sort((a, b) => +new Date(b.date) - +new Date(a.date))
          .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
          .slice(0, 30);

        if (mounted) setItems(deduped);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to fetch feeds');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFeeds();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">Health News</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Latest verified updates and local health stories.</p>
      </header>

      {loading && <div className="text-sm text-slate-500">Loading news…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <section className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && !loading ? (
            <div className="col-span-full text-sm text-slate-500">No news items found.</div>
          ) : (
            items.map((n) => (
              <NewsCard key={n.id} thumbnail={n.thumbnail} title={n.title} source={n.source} date={n.date} verified={n.verified === 'who' ? 'who' : n.verified === 'moh' ? 'moh' : null} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
