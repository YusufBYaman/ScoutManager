import React from 'react';

export default function RatingBadge({ val, isPot = false, className = '' }) {
  const rating = Number(val) || 0;
  
  let bgClass = 'rating-bronze';
  if (rating >= 85) {
    bgClass = 'rating-elite';
  } else if (rating >= 80) {
    bgClass = 'rating-gold-high';
  } else if (rating >= 75) {
    bgClass = 'rating-gold';
  } else if (rating >= 70) {
    bgClass = 'rating-silver-high';
  } else if (rating >= 65) {
    bgClass = 'rating-silver';
  }

  return (
    <span className={`rating-badge ${bgClass} ${isPot ? 'potential-badge' : ''} ${className}`} title={isPot ? `Potansiyel: ${rating}` : `Genel Reyting: ${rating}`}>
      {rating}
    </span>
  );
}
