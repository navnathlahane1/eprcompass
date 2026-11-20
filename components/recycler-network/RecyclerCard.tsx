'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, Star, BadgeCheck, Pause, XCircle } from 'lucide-react';
import { ratingToBadge } from '@/lib/recyclerNetwork/recyclerNetworkService';

const EPR_CATEGORY_COLORS: Record<string, string> = {
  PLASTIC:    'bg-blue-100 text-blue-700',
  EWASTE:     'bg-purple-100 text-purple-700',
  BATTERY:    'bg-yellow-100 text-yellow-700',
  USED_OIL:   'bg-orange-100 text-orange-700',
  TYRE:       'bg-gray-100 text-gray-700',
};

const LINK_STATUS_ICONS = {
  ACTIVE: <BadgeCheck className="h-4 w-4 text-green-500" />,
  PAUSED: <Pause className="h-4 w-4 text-amber-500" />,
  REMOVED: <XCircle className="h-4 w-4 text-red-400" />,
};

interface RecyclerCardProps {
  id: string;
  recyclerCode: string;
  name: string;
  type: 'RECYCLER' | 'PRO';
  eprCategories: string[];
  authorizedStates: string[];
  verificationStatus: string;
  overallRating?: number | null;
  linkStatus?: 'ACTIVE' | 'PAUSED' | 'REMOVED' | null;
  onLink?: (id: string) => void;
  onUnlink?: (id: string) => void;
  href?: string;
}

const StarRating = memo(({ score }: { score: number }) => {
  const stars = Math.round(score);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{score.toFixed(1)}</span>
    </div>
  );
});
StarRating.displayName = 'StarRating';

export const RecyclerCard = memo(function RecyclerCard({
  id,
  recyclerCode,
  name,
  type,
  eprCategories,
  authorizedStates,
  verificationStatus,
  overallRating,
  linkStatus,
  onLink,
  onUnlink,
  href,
}: RecyclerCardProps) {
  const isLinked = linkStatus === 'ACTIVE';
  const badge = overallRating != null ? ratingToBadge(overallRating) : null;

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-eco-green-5/10 px-2 py-0.5 text-xs font-medium text-eco-green-5">
              {type}
            </span>
            {linkStatus && (
              <span title={`Link: ${linkStatus}`}>{LINK_STATUS_ICONS[linkStatus]}</span>
            )}
          </div>
          <h3 className="mt-1 truncate font-semibold text-gray-900 dark:text-white">
            {href ? (
              <Link href={href} className="hover:underline focus:outline-none focus:underline">
                {name}
              </Link>
            ) : name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{recyclerCode}</p>
        </div>

        {badge && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            badge === 'Excellent' ? 'bg-green-100 text-green-700' :
            badge === 'Good'      ? 'bg-lime-100 text-lime-700' :
            badge === 'Average'   ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {badge}
          </span>
        )}
      </div>

      {/* Rating */}
      {overallRating != null && (
        <div className="mt-2">
          <StarRating score={overallRating} />
        </div>
      )}

      {/* EPR categories */}
      <div className="mt-3 flex flex-wrap gap-1">
        {eprCategories.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${EPR_CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* States */}
      <div className="mt-2 flex items-start gap-1 text-xs text-gray-500 dark:text-gray-400">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="line-clamp-2">{authorizedStates.slice(0, 6).join(', ')}{authorizedStates.length > 6 ? ` +${authorizedStates.length - 6}` : ''}</span>
      </div>

      {/* Actions */}
      {(onLink || onUnlink) && (
        <div className="mt-4 flex gap-2">
          {!isLinked && onLink && (
            <button
              onClick={() => onLink(id)}
              aria-label={`Link ${name} to your network`}
              className="flex-1 rounded-lg bg-eco-green-5 px-3 py-1.5 text-xs font-medium text-white hover:bg-eco-green-4 focus:outline-none focus:ring-2 focus:ring-eco-green-5 focus:ring-offset-1 transition"
            >
              + Link
            </button>
          )}
          {isLinked && onUnlink && (
            <button
              onClick={() => onUnlink(id)}
              aria-label={`Remove ${name} from your network`}
              className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition"
            >
              Unlink
            </button>
          )}
        </div>
      )}
    </article>
  );
});
