import React, { useMemo, useState } from 'react';
import Flag from './Flag';
import RatingBadge from './RatingBadge';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function WonderkidsView({ players, onSelectPlayer }) {
  const [minPot, setMinPot] = useState(83);
  const [maxAge, setMaxAge] = useState(21);
  const [gender, setGender] = useState('0');
  const [sortField, setSortField] = useState('potential');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const descByDefault = ['overall', 'potential', 'growthDiff', 'wage', 'value'].includes(field);
      setSortDirection(descByDefault ? 'desc' : 'asc');
    }
  };

  const wonderkids = useMemo(() => {
    const list = players.filter((p) => {
      if (gender !== '' && p.gender !== Number(gender)) return false;
      return p.age && p.age <= maxAge && p.potential >= minPot;
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
      if (b.potential !== a.potential) return b.potential - a.potential;
      if (b.overall !== a.overall) return b.overall - a.overall;
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [players, minPot, maxAge, gender, sortField, sortDirection]);

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
    <div className="wonderkids-view-wrapper">
      <div className="view-banner">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Geleceğin Yıldızları ({wonderkids.length})</h2>
            <p className="text-sm text-gray-400">
              Kariyer modunda en yüksek gelişim potansiyeline sahip genç yetenekler
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Kategori:</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="select-field text-sm py-1.5 px-3"
            >
              <option value="0">Erkek (Varsayılan)</option>
              <option value="1">Kadın</option>
              <option value="">Tümü</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Maks. Yaş:</span>
            <select
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="select-field text-sm py-1.5 px-3"
            >
              <option value="19">19 Yaş ve Altı</option>
              <option value="20">20 Yaş ve Altı</option>
              <option value="21">21 Yaş ve Altı</option>
              <option value="22">22 Yaş ve Altı</option>
              <option value="23">23 Yaş ve Altı</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Min. Potansiyel:</span>
            <select
              value={minPot}
              onChange={(e) => setMinPot(Number(e.target.value))}
              className="select-field text-sm py-1.5 px-3"
            >
              <option value="80">80+</option>
              <option value="83">83+</option>
              <option value="85">85+</option>
              <option value="88">88+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              {renderSortTh('name', 'Oyuncu')}
              {renderSortTh('primaryPosition', 'Mevki')}
              {renderSortTh('age', 'Yaş', { textAlign: 'center' })}
              {renderSortTh('birthDateStr', 'Doğum Tarihi')}
              {renderSortTh('overall', 'Mevcut OVR', { textAlign: 'center' })}
              {renderSortTh('potential', 'Potansiyel', { textAlign: 'center' })}
              {renderSortTh('growthDiff', 'Gelişim Payı', { textAlign: 'center' })}
              {renderSortTh('teamName', 'Takım & Lig')}
              {renderSortTh('wage', 'Maaş')}
              {renderSortTh('value', 'Tahmini Değer')}
            </tr>
          </thead>
          <tbody>
            {wonderkids.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-8 text-gray-500">
                  Kriterlere uygun genç yetenek bulunamadı.
                </td>
              </tr>
            ) : (
              wonderkids.slice(0, 100).map((p, idx) => (
                <tr key={p.id} onClick={() => onSelectPlayer(p)} className="table-row-clickable">
                  <td className="text-muted font-mono">{idx + 1}</td>
                  <td>
                    <div className="player-cell">
                      <Flag code={p.countryCode} name={p.nationalityName} />
                      <div className="font-semibold text-white">{p.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="pos-badge primary-pos">{p.primaryPosition}</span>
                  </td>
                  <td className="font-semibold text-center">{p.age}</td>
                  <td className="text-muted text-xs">{p.birthDateStr}</td>
                  <td className="text-center">
                    <RatingBadge val={p.overall} />
                  </td>
                  <td className="text-center">
                    <RatingBadge val={p.potential} isPot />
                  </td>
                  <td className="text-center">
                    <span className="text-emerald-400 font-bold">+{p.growthDiff}</span>
                  </td>
                  <td>
                    <div className="text-white text-sm">{p.teamName}</div>
                    <div className="text-xs text-gray-500">{p.leagueName}</div>
                  </td>
                  <td className="font-mono text-sm">{p.formattedWage}</td>
                  <td className="font-mono text-sm text-emerald-400 font-semibold">{p.formattedValue}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
