import React from 'react';

type Verification = 'who' | 'moh' | null;

type NewsCardProps = {
  thumbnail?: string;
  title: string;
  source: string;
  date: string; // ISO
  verified?: Verification;
};

function VerificationBadge({ verified }: { verified?: Verification }) {
  if (!verified) return null;
  const label = verified === 'who' ? 'WHO' : 'Ministry of Health';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 rounded">
      <span className="text-green-600">✅</span>
      {label}
    </span>
  );
}

export function NewsCard({ thumbnail, title, source, date, verified }: NewsCardProps) {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString();

  return (
    <article className="flex flex-col bg-white dark:bg-slate-800 shadow-sm rounded-md overflow-hidden">
      {thumbnail ? (
        <div className="h-40 w-full overflow-hidden bg-slate-100">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-40 w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <div className="text-sm text-slate-500">No image</div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-200">{source}</span>
            <VerificationBadge verified={verified} />
          </div>
          <time dateTime={date}>{dateStr}</time>
        </div>
      </div>
    </article>
  );
}

export default NewsCard;
