import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Pill, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { globalSearchApi } from '../api';

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [localQ, setLocalQ] = useState(initialQ);

  const q = searchParams.get('q') ?? '';

  useEffect(() => {
    setLocalQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['globalSearch', q],
    queryFn: () => globalSearchApi(q),
    enabled: q.trim().length > 0,
  });

  const empty = useMemo(
    () => q.trim().length === 0,
    [q],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = localQ.trim();
    if (next) {
      setSearchParams({ q: next });
    }
  };

  const totalHits =
    (data?.advisories.length ?? 0) + (data?.diseases.length ?? 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('searchTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('searchSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <Button type="submit" className="shrink-0 rounded-xl">
          {t('searchAction')}
        </Button>
      </form>

      {empty && (
        <p className="text-muted-foreground text-sm">{t('searchPrompt')}</p>
      )}

      {!empty && isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('searchLoading')}
        </div>
      )}

      {!empty && isError && (
        <p className="text-destructive text-sm">
          {(error as Error)?.message ?? t('searchError')}
        </p>
      )}

      {!empty && !isLoading && data && totalHits === 0 && (
        <p className="text-muted-foreground">{t('searchNoResults')}</p>
      )}

      {!empty && data && data.advisories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('approvedAdvisories')}
          </h2>
          <ul className="space-y-2">
            {data.advisories.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.diseaseType} · {a.region.name} · {a.riskLevel}
                      {a.status === 'DRAFT' ? ` · ${t('draftStatus')}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {a.content}
                    </p>
                  </div>
                  <Link
                    to="/advisory"
                    className="text-primary text-sm font-medium shrink-0 inline-flex items-center gap-1"
                  >
                    {t('viewAdvisory')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!empty && data && data.diseases.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Pill className="h-4 w-4" />
            {t('disease')}
          </h2>
          <ul className="space-y-2">
            {data.diseases.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
              >
                <p className="font-medium">{d.name}</p>
                {d.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {d.description}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {d.code}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
