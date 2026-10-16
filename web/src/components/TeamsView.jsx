import React, { useState, useMemo } from 'react';
import { Shield, Search } from 'lucide-react';
import RatingBadge from './RatingBadge';

export default function TeamsView({ teams }) {
  const [search, setSearch] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [sortField, setSortField] = useState('overall');
  const [sortDirection, setSortDirection] = useState('desc');

  const leaguesList = useMemo(() => {
    const s = new Set();
    teams.forEach((t) => {
      if (t.league) s.add(t.league);
    });
    return Array.from(s).sort();
  }, [teams]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const descByDefault = ['overall', 'attack', 'midfield', 'defense', 'stadiumCapacity'].includes(field);
      setSortDirection(descByDefault ? 'desc' : 'asc');
    }
  };

  const filteredTeams = useMemo(() => {
    const s = search.toLowerCase().trim();
    const list = teams.filter((t) => {
      if (s && !t.name.toLowerCase().includes(s)) return false;
      if (selectedLeague && t.league !== selectedLeague) return false;
      return true;
    });

    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (typeof vA === 'string') {
        const cmp = sortDirection === 'asc'
          ? (vA || '').localeCompare(vB || '', 'tr')
          : (vB || '').localeCompare(vA || '', 'tr');
        if (cmp !== 0) return cmp;
      } else {
        vA = vA !== undefined && vA !== null ? vA : 0;
        vB = vB !== undefined && vB !== null ? vB : 0;
        const diff = sortDirection === 'asc' ? vA - vB : vB - vA;
        if (diff !== 0) return diff;
      }
      if (b.overall !== a.overall) return b.overall - a.overall;
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [teams, search, selectedLeague, sortField, sortDirection]);

  const renderSortTh = (field, label, style = {}) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`sortable-th ${isActive ? 'sort-active' : ''}`}
        style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      >
        <span>{label}</span>
        {isActive && (
          <span className="sort-arrow" style={{ marginLeft: '4px', fontSize: '10px', color: '#38bdf8' }}>
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </th>
    );
  };

  return (
    <div className="teams-view-wrapper">
      <div className="view-banner">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tüm Kulüpler ({filteredTeams.length})</h2>
            <p className="text-sm text-gray-400">
              Dünya genelindeki tüm lisanslı ve özel takımların güç puanları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Kulüp Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-1.5 px-3 text-sm"
            />
          </div>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="select-field text-sm py-1.5 px-3"
          >
            <option value="">Tüm Ligler</option>
            {leaguesList.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              {renderSortTh('name', 'Kulüp Adı')}
              {renderSortTh('league', 'Lig')}
              {renderSortTh('overall', 'Genel Güç', { textAlign: 'center' })}
              {renderSortTh('attack', 'Hücum', { textAlign: 'center' })}
              {renderSortTh('midfield', 'Orta Saha', { textAlign: 'center' })}
              {renderSortTh('defense', 'Savunma', { textAlign: 'center' })}
              {renderSortTh('stadiumCapacity', 'Stadyum Kapasitesi')}
              {renderSortTh('foundationYear', 'Kuruluş')}
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">
                  Aranan kriterlere uygun kulüp bulunamadı.
                </td>
              </tr>
            ) : (
              filteredTeams.map((t, idx) => (
                <tr key={t.id}>
                  <td className="text-muted font-mono">{idx + 1}</td>
                  <td className="font-bold text-white">{t.name}</td>
                  <td className="text-gray-400 text-sm">{t.league || '-'}</td>
                  <td className="text-center">
                    <RatingBadge val={t.overall} />
                  </td>
                  <td className="text-center">
                    <RatingBadge val={t.attack} />
                  </td>
                  <td className="text-center">
                    <RatingBadge val={t.midfield} />
                  </td>
                  <td className="text-center">
                    <RatingBadge val={t.defense} />
                  </td>
                  <td className="font-mono text-sm">
                    {t.stadiumCapacity ? t.stadiumCapacity.toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="text-muted">{t.foundationYear || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
