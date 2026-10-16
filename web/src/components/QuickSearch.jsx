import React, { useState, useRef, useEffect } from 'react';
import Flag from './Flag';
import RatingBadge from './RatingBadge';
import { Search, X } from 'lucide-react';
import { searchPlayersByNamePrefix } from '../search/searchIndex';

export default function QuickSearch({ players, onSelectPlayer }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const matches = searchPlayersByNamePrefix(players, query.trim(), 12);
    setResults(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(0);
  }, [query, players]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectPlayer(results[selectedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (p) => {
    onSelectPlayer(p);
    setIsOpen(false);
  };

  return (
    <div className="quick-search-wrapper" ref={containerRef}>
      <div className="quick-search-input-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Hızlı Oyuncu Ara (Örn: Jo, Arda, Haaland)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="quick-search-input"
        />
        {query && (
          <button className="clear-btn" onClick={() => { setQuery(''); setIsOpen(false); }}>
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="quick-search-dropdown">
          <div className="dropdown-header">
            <span>"{query}" ile başlayan oyuncular ({results.length})</span>
          </div>
          <table className="quick-search-table">
            <tbody>
              {results.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`quick-search-row ${selectedIndex === idx ? 'selected' : ''}`}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <td className="flag-col">
                    <Flag code={p.countryCode} name={p.nationalityName} />
                  </td>
                  <td className="name-col">
                    <span className="player-display-name">{p.name}</span>
                    <span className="player-team-sub">{p.teamName}</span>
                  </td>
                  <td className="pos-col">
                    <span className="pos-chip">{p.primaryPosition}</span>
                  </td>
                  <td className="age-col">{p.age} yaş</td>
                  <td className="rating-col">
                    <RatingBadge val={p.overall} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
