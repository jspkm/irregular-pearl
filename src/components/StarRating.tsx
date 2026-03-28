interface StarRatingProps {
  rating: number; // 0-5
  size?: 'sm' | 'md';
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={`${textSize} text-[#f59e0b]`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? '' : 'opacity-30'}>★</span>
      ))}
    </span>
  );
}
