import React, { useState } from 'react';
import Flag from './Flag';
import RatingBadge from './RatingBadge';
import { Users, DollarSign, Calendar, Award, Shield } from 'lucide-react';

export default function SquadView({ club, starters, substitutes, onSelectPlayer }) {
  const [sortField, setSortField] = useState('squadPositionCode');
  const [sortDirection, setSortDirection] = useState('asc');

  if (!club) {
    return (
      <div className="empty-state-box">
        <Shield size={48} className="text-gray-500 mb-3" />
        <h3>Yönetilen Kulüp Bilgisi Bulunamadı</h3>
        <p>Save dosyasında aktif bir teknik direktör kariyeri bulunamadı.</p>
      </div>
    );
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const descByDefault = ['overall', 'potential', 'wage', 'value', 'age'].includes(field);
      setSortDirection(descByDefault ? 'desc' : 'asc');
    }
  };

  const sortList = (list) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
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
      return (a.name || '').localeCompare(b.name || '');
    });
  };

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

  const renderPlayerTable = (playersList, title, badgeText, badgeColor) => {
    const sorted = sortList(playersList);

    return (
      <div className="squad-table-section">
        <div className="table-header-row">
          <div className="table-title-group">
            <h3>{title}</h3>
            <span className="count-badge" style={{ backgroundColor: badgeColor }}>
              {badgeText} ({playersList.length})
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {renderSortTh('jerseyNumber', '#', { width: '50px' })}
                {renderSortTh('name', 'Oyuncu')}
                {renderSortTh('primaryPosition', 'Mevki')}
                {renderSortTh('age', 'Yaş')}
                {renderSortTh('birthDateStr', 'Doğum Tarihi')}
                {renderSortTh('overall', 'OVR')}
                {renderSortTh('potential', 'POT')}
                {renderSortTh('wage', 'Haftalık Maaş')}
                {renderSortTh('value', 'Tahmini Değer')}
                {renderSortTh('contractExpiry', 'Sözleşme Bitiş')}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-gray-500">
                    Bu grupta oyuncu bulunmuyor.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => (
                  <tr key={p.id} onClick={() => onSelectPlayer(p)} className="table-row-clickable">
                    <td className="text-muted font-mono">{p.jerseyNumber ? p.jerseyNumber : '-'}</td>
                    <td>
                      <div className="player-cell">
                        <Flag code={p.countryCode} name={p.nationalityName} />
                        <div className="player-names">
                          <span className="player-main-name">{p.name}</span>
                          {p.loanStatus !== 'Bonservisli' && (
                            <span className="loan-sub-tag">Kiralık</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pos-badge primary-pos">{p.primaryPosition}</span>
                    </td>
                    <td className="font-semibold">{p.age}</td>
                    <td className="text-muted">
                      {p.birthDateStr || '-'}
                    </td>
                    <td>
                      <RatingBadge val={p.overall} />
                    </td>
                    <td>
                      <RatingBadge val={p.potential} isPot />
                    </td>
                    <td className="font-mono">{p.formattedWage}</td>
                    <td className="font-mono text-emerald-400 font-semibold">{p.formattedValue}</td>
                    <td className="text-muted">{p.contractExpiry || 'Bilinmiyor'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="squad-view-wrapper">
      {/* Club Overview Banner */}
      <div className="club-overview-card">
        <div className="club-left-info">
          <div className="club-icon-circle">
            <Shield size={32} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="club-name-heading">{club.name}</h2>
            <div className="club-sub-tags">
              <span>Teknik Direktör: <strong>{club.managerName || 'Menajer'}</strong></span>
              <span className="sub-dot">•</span>
              <span>Sezon: <strong>{club.season}. Sezon</strong></span>
            </div>
          </div>
        </div>

        <div className="club-stats-bar">
          <div className="club-metric">
            <span className="metric-lbl">Kadro Genişliği</span>
            <span className="metric-val">{club.squadCount} Oyuncu</span>
          </div>
          <div className="club-metric">
            <span className="metric-lbl">Toplam Maaş Yükü</span>
            <span className="metric-val font-mono text-emerald-400">
              €{club.totalSquadWage ? club.totalSquadWage.toLocaleString('tr-TR') : 0} /hf
            </span>
          </div>
        </div>
      </div>

      {/* Tablo 1: As Oyuncular (Starting XI) */}
      {renderPlayerTable(starters, 'As Oyuncular (İlk 11)', 'As Kadro', '#10b981')}

      {/* Tablo 2: Yedekler (Substitutes & Reserves) */}
      {renderPlayerTable(substitutes, 'Yedekler & Rezervler', 'Yedek Kulübesi', '#64748b')}
    </div>
  );
}
