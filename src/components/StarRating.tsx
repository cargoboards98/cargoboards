import { Star } from 'lucide-react';

export function StarRating({
  rating,
  reviews,
  size = 14,
  showReviews = true,
}: {
  rating: number;
  reviews?: number;
  size?: number;
  showReviews?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-ink-600" strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-warning-400 fill-warning-400" strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </span>
      <span className="font-semibold text-ink-200">{rating.toFixed(1)}</span>
      {showReviews && reviews !== undefined && (
        <span className="text-xs text-ink-500">({reviews})</span>
      )}
    </span>
  );
}
