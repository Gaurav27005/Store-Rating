import React, { useState } from 'react';

export function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="star-display">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star${i <= Math.round(rating) ? ' filled' : ''}`} style={{ fontSize: size }}>★</span>
      ))}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`star${i <= (hover || value) ? ' filled' : ''}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  );
}
