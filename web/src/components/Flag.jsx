import React from 'react';

export default function Flag({ code, name, className = 'w-5 h-3.5 object-cover rounded-sm inline-block shadow-sm' }) {
  if (!code || code === 'un') {
    return <span className="inline-block text-xs text-gray-500 mr-1.5" title={name || 'Bilinmiyor'}>🏳️</span>;
  }

  const cleanCode = code.toLowerCase().trim();
  const flagUrl = `https://flagcdn.com/24x18/${cleanCode}.png`;

  return (
    <img
      src={flagUrl}
      alt={name || code}
      title={name || code}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}
