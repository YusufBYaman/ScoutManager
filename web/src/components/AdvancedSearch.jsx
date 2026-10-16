import React, { useState, useMemo } from 'react';
import Flag from './Flag';
import RatingBadge from './RatingBadge';
import { Search, RotateCcw, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeSearchText } from '../search/searchIndex';

const INITIAL_FILTERS = {
  gender: '0',
  name: '',
  league: '',
  team: '',
  nationality: '',
  posGroup: '',
  foot: '',
  minSkillMoves: '',
  minWeakFoot: '',
  minAge: 15,
  maxAge: 45,
  minOvr: 0,
  maxOvr: 99,
  minPot: 0,
  maxPot: 99,
  minValue: '',
  maxValue: '',
  minWage: '',
  maxWage: '',
  // 6 Pillar Card Stats
  minPac: '',
  minSho: '',
  minPas: '',
  minDri: '',
  minDef: '',
  minPhy: '',
  // Detailed attributes
  minSprint: '',
  minFinishing: '',
  minShortPassing: '',
  minDribbling: '',
  minDefAwareness: '',
  minStamina: '',
  minStrength: '',
  minGkReflexes: '',
};

export default function AdvancedSearch({ players, onSelectPlayer }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [sortField, setSortField] = useState('overall');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Collapsible accordion sections
  const [openSections, setOpenSections] = useState({
    general: true,
    pillars: true,
    attributes: false,
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Distinct lists for dropdowns
  const leaguesList = useMemo(() => {
    const s = new Set();
    players.forEach(p => { if (p.leagueName) s.add(p.leagueName); });
    return Array.from(s).sort();
  }, [players]);

  const teamsList = useMemo(() => {
    const s = new Set();
    players.forEach(p => { if (p.teamName && p.teamName !== 'Serbest Oyuncu') s.add(p.teamName); });
    return Array.from(s).sort();
  }, [players]);

  const nationsList = useMemo(() => {
    const m = new Map();
    players.forEach(p => {
      if (p.nationalityName && !m.has(p.nationalityName)) {
        m.set(p.nationalityName, p.countryCode);
      }
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  }, [players]);

  // Handle filter changes
  const handleChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const handleApply = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  // Filtered & Sorted players
  const filteredPlayers = useMemo(() => {
    const f = appliedFilters;
    const normName = normalizeSearchText(f.name);

    return players.filter(p => {
      // Name
      if (normName) {
        const pNorm = normalizeSearchText(p.name);
        const pFirst = normalizeSearchText(p.firstName);
        const pLast = normalizeSearchText(p.lastName);
        const pCommon = normalizeSearchText(p.commonName);
        if (!pNorm.includes(normName) && !pFirst.includes(normName) && !pLast.includes(normName) && !pCommon.includes(normName)) {
          return false;
        }
      }

      // Gender (0: Erkek, 1: Kadın, '': Tümü)
      if (f.gender !== '' && f.gender !== undefined) {
        if (p.gender !== Number(f.gender)) return false;
      }

      // League & Team & Nation
      if (f.league && p.leagueName !== f.league) return false;
      if (f.team && p.teamName !== f.team) return false;
      if (f.nationality && p.nationalityName !== f.nationality) return false;

      // Position
      if (f.posGroup) {
        if (!p.positions.includes(f.posGroup) && p.primaryPosition !== f.posGroup) return false;
      }

      // Foot & Skills
      if (f.foot && p.preferredFoot !== f.foot) return false;
      if (f.minSkillMoves && p.skillMoves < Number(f.minSkillMoves)) return false;
      if (f.minWeakFoot && p.weakFoot < Number(f.minWeakFoot)) return false;

      // Range numbers
      if (p.age < Number(f.minAge) || p.age > Number(f.maxAge)) return false;
      if (p.overall < Number(f.minOvr) || p.overall > Number(f.maxOvr)) return false;
      if (p.potential < Number(f.minPot) || p.potential > Number(f.maxPot)) return false;

      if (f.minValue && p.value < Number(f.minValue)) return false;
      if (f.maxValue && p.value > Number(f.maxValue)) return false;

      if (f.minWage && p.wage < Number(f.minWage)) return false;
      if (f.maxWage && p.wage > Number(f.maxWage)) return false;

      // 6 Pillar Card Stats
      if (f.minPac && p.pac < Number(f.minPac)) return false;
      if (f.minSho && p.sho < Number(f.minSho)) return false;
      if (f.minPas && p.pas < Number(f.minPas)) return false;
      if (f.minDri && p.dri < Number(f.minDri)) return false;
      if (f.minDef && p.def < Number(f.minDef)) return false;
      if (f.minPhy && p.phy < Number(f.minPhy)) return false;

      // Detailed stats
      if (f.minSprint && p.sprintSpeed < Number(f.minSprint)) return false;
      if (f.minFinishing && p.finishing < Number(f.minFinishing)) return false;
      if (f.minShortPassing && p.shortPassing < Number(f.minShortPassing)) return false;
      if (f.minDribbling && p.dribbling < Number(f.minDribbling)) return false;
      if (f.minDefAwareness && p.defensiveAwareness < Number(f.minDefAwareness)) return false;
      if (f.minStamina && p.stamina < Number(f.minStamina)) return false;
      if (f.minStrength && p.strength < Number(f.minStrength)) return false;
      if (f.minGkReflexes && p.gkReflexes < Number(f.minGkReflexes)) return false;

      return true;
    });
  }, [players, appliedFilters]);

  // Sort
  const sortedPlayers = useMemo(() => {
    const list = [...filteredPlayers];
    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (typeof vA === 'string') {
        const cmp = sortDirection === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
        if (cmp !== 0) return cmp;
      } else {
        vA = vA !== undefined && vA !== null ? vA : 0;
        vB = vB !== undefined && vB !== null ? vB : 0;
        const diff = sortDirection === 'asc' ? vA - vB : vB - vA;
        if (diff !== 0) return diff;
      }
      // Secondary tie-breakers: Overall desc, then Potential desc, then Name asc
      if (b.overall !== a.overall) return b.overall - a.overall;
      if (b.potential !== a.potential) return b.potential - a.potential;
      return (a.name || '').localeCompare(b.name || '');
    });
    return list;
  }, [filteredPlayers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedPlayers.length / pageSize) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPlayers.slice(start, start + pageSize);
  }, [sortedPlayers, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="advanced-search-layout">
      {/* Sol Filtre Paneli (SoFIFA Style) */}
      <aside className="filter-sidebar">
        <div className="filter-top-bar">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-emerald-400" />
            <h3 className="font-bold text-white text-base">Filtreler</h3>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleReset} className="filter-btn-secondary" title="Filtreleri Sıfırla">
              <RotateCcw size={14} /> Sıfırla
            </button>
            <button type="button" onClick={handleApply} className="filter-btn-primary">
              Uygula
            </button>
          </div>
        </div>

        <form onSubmit={handleApply} className="filter-form">
          {/* Adı ile filtreleme */}
          <div className="form-group">
            <label>Oyuncu Adı (Filtre İçi)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Örn: Kylian, Arda..."
                value={filters.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Kategori / Cinsiyet */}
          <div className="form-group">
            <label>Kategori (Cinsiyet)</label>
            <select
              value={filters.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="select-field"
            >
              <option value="0">Erkek Futbolcular (Varsayılan)</option>
              <option value="1">Kadın Futbolcular</option>
              <option value="">Tümü (Erkek & Kadın)</option>
            </select>
          </div>

          {/* Lig & Takım & Ülke */}
          <div className="form-group">
            <label>Lig</label>
            <select
              value={filters.league}
              onChange={(e) => handleChange('league', e.target.value)}
              className="select-field"
            >
              <option value="">Tüm Ligler</option>
              {leaguesList.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Kulüp / Takım</label>
            <select
              value={filters.team}
              onChange={(e) => handleChange('team', e.target.value)}
              className="select-field"
            >
              <option value="">Tüm Takımlar</option>
              {teamsList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ülke / Milliyet</label>
            <select
              value={filters.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              className="select-field"
            >
              <option value="">Tüm Ülkeler</option>
              {nationsList.map(([name, code]) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Yaş Aralığı */}
          <div className="form-group">
            <label>Yaş ({filters.minAge} - {filters.maxAge})</label>
            <div className="dual-input-row">
              <input
                type="number"
                min="14"
                max="45"
                value={filters.minAge}
                onChange={(e) => handleChange('minAge', e.target.value)}
                className="input-field"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="14"
                max="45"
                value={filters.maxAge}
                onChange={(e) => handleChange('maxAge', e.target.value)}
                className="input-field"
                placeholder="Maks"
              />
            </div>
          </div>

          {/* Genel Reyting & Potansiyel */}
          <div className="form-group">
            <label>Genel Reyting ({filters.minOvr} - {filters.maxOvr})</label>
            <div className="dual-input-row">
              <input
                type="number"
                min="0"
                max="99"
                value={filters.minOvr}
                onChange={(e) => handleChange('minOvr', e.target.value)}
                className="input-field"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.maxOvr}
                onChange={(e) => handleChange('maxOvr', e.target.value)}
                className="input-field"
                placeholder="Maks"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Potansiyel ({filters.minPot} - {filters.maxPot})</label>
            <div className="dual-input-row">
              <input
                type="number"
                min="0"
                max="99"
                value={filters.minPot}
                onChange={(e) => handleChange('minPot', e.target.value)}
                className="input-field"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                max="99"
                value={filters.maxPot}
                onChange={(e) => handleChange('maxPot', e.target.value)}
                className="input-field"
                placeholder="Maks"
              />
            </div>
          </div>

          {/* Pozisyon */}
          <div className="form-group">
            <label>Pozisyon</label>
            <select
              value={filters.posGroup}
              onChange={(e) => handleChange('posGroup', e.target.value)}
              className="select-field"
            >
              <option value="">Tüm Pozisyonlar</option>
              <option value="GK">Kaleci (GK)</option>
              <option value="CB">Stoper (CB)</option>
              <option value="LB">Sol Bek (LB)</option>
              <option value="RB">Sağ Bek (RB)</option>
              <option value="CDM">Ön Libero (CDM)</option>
              <option value="CM">Merkez Orta Saha (CM)</option>
              <option value="CAM">Ofansif Orta Saha (CAM)</option>
              <option value="LM">Sol Orta (LM)</option>
              <option value="RM">Sağ Orta (RM)</option>
              <option value="LW">Sol Kanat (LW)</option>
              <option value="RW">Sağ Kanat (RW)</option>
              <option value="ST">Santrfor (ST)</option>
            </select>
          </div>

          {/* Ayak & Beceriler */}
          <div className="form-group">
            <label>Tercih Ettiği Ayak</label>
            <select
              value={filters.foot}
              onChange={(e) => handleChange('foot', e.target.value)}
              className="select-field"
            >
              <option value="">Farketmez</option>
              <option value="Sağ">Sağ Ayak</option>
              <option value="Sol">Sol Ayak</option>
            </select>
          </div>

          <div className="form-group">
            <label>Min. Beceri / Zayıf Ayak (Yıldız)</label>
            <div className="dual-input-row">
              <select
                value={filters.minSkillMoves}
                onChange={(e) => handleChange('minSkillMoves', e.target.value)}
                className="select-field"
              >
                <option value="">BH: Tümü</option>
                <option value="2">BH: 2★+</option>
                <option value="3">BH: 3★+</option>
                <option value="4">BH: 4★+</option>
                <option value="5">BH: 5★</option>
              </select>
              <select
                value={filters.minWeakFoot}
                onChange={(e) => handleChange('minWeakFoot', e.target.value)}
                className="select-field"
              >
                <option value="">ZA: Tümü</option>
                <option value="2">ZA: 2★+</option>
                <option value="3">ZA: 3★+</option>
                <option value="4">ZA: 4★+</option>
                <option value="5">ZA: 5★</option>
              </select>
            </div>
          </div>

          {/* 6 Ana Kart Puanı (Accordion) */}
          <div className="accordion-section">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleSection('pillars')}
            >
              <span>6 Ana Kart Puanı (PAC / SHO / PAS...)</span>
              {openSections.pillars ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {openSections.pillars && (
              <div className="accordion-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Hız (PAC)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minPac}
                      onChange={(e) => handleChange('minPac', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Şut (SHO)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minSho}
                      onChange={(e) => handleChange('minSho', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Pas (PAS)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minPas}
                      onChange={(e) => handleChange('minPas', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Dribling (DRI)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minDri}
                      onChange={(e) => handleChange('minDri', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Defans (DEF)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minDef}
                      onChange={(e) => handleChange('minDef', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '11px' }}>Min. Fizik (PHY)</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={filters.minPhy}
                      onChange={(e) => handleChange('minPhy', e.target.value)}
                      className="input-field"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                      placeholder="0-99"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detaylı Nitelik Filtreleri (Accordion) */}
          <div className="accordion-section">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleSection('attributes')}
            >
              <span>Detaylı Yetenek Değerleri</span>
              {openSections.attributes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {openSections.attributes && (
              <div className="accordion-content">
                <div className="form-group">
                  <label>Min. Depar Hızı</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minSprint}
                    onChange={(e) => handleChange('minSprint', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Bitiricilik</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minFinishing}
                    onChange={(e) => handleChange('minFinishing', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Kısa Pas</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minShortPassing}
                    onChange={(e) => handleChange('minShortPassing', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Dripling</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minDribbling}
                    onChange={(e) => handleChange('minDribbling', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Savunma Bilinci</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minDefAwareness}
                    onChange={(e) => handleChange('minDefAwareness', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
                <div className="form-group">
                  <label>Min. Dayanıklılık</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={filters.minStamina}
                    onChange={(e) => handleChange('minStamina', e.target.value)}
                    className="input-field"
                    placeholder="0-99"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </aside>

      {/* Sağ Sonuç Tablosu */}
      <main className="search-results-area">
        <div className="results-toolbar">
          <div className="results-count-chip">
            <strong>{filteredPlayers.length.toLocaleString('tr-TR')}</strong> Oyuncu Bulundu
          </div>

          <div className="toolbar-controls">
            <div className="page-size-selector">
              <span>Sayfa Başına:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="cursor-pointer">
                  Oyuncu {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('age')} className="cursor-pointer">
                  Yaş {sortField === 'age' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('birthDateStr')} className="cursor-pointer">
                  Doğum Tarihi {sortField === 'birthDateStr' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('overall')} className="cursor-pointer">
                  OVR {sortField === 'overall' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('potential')} className="cursor-pointer">
                  POT {sortField === 'potential' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('growthDiff')} className="cursor-pointer">
                  Fark {sortField === 'growthDiff' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('pac')} className="cursor-pointer text-center text-xs" title="Hız (Pace)">
                  PAC {sortField === 'pac' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('sho')} className="cursor-pointer text-center text-xs" title="Şut (Shooting)">
                  SHO {sortField === 'sho' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('pas')} className="cursor-pointer text-center text-xs" title="Pas (Passing)">
                  PAS {sortField === 'pas' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('dri')} className="cursor-pointer text-center text-xs" title="Dripling (Dribbling)">
                  DRI {sortField === 'dri' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('def')} className="cursor-pointer text-center text-xs" title="Defans (Defending)">
                  DEF {sortField === 'def' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('phy')} className="cursor-pointer text-center text-xs" title="Fizik (Physical)">
                  PHY {sortField === 'phy' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('teamName')} className="cursor-pointer">
                  Takım & Lig {sortField === 'teamName' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('wage')} className="cursor-pointer">
                  Maaş {sortField === 'wage' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('value')} className="cursor-pointer">
                  Tahmini Değer {sortField === 'value' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('contractExpiry')} className="cursor-pointer">
                  Sözleşme {sortField === 'contractExpiry' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="16" className="text-center py-10 text-gray-500">
                    Filtrelere uygun oyuncu bulunamadı. Lütfen filtre kriterlerini gevşetin.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map(p => (
                  <tr key={p.id} onClick={() => onSelectPlayer(p)} className="table-row-clickable">
                    <td>
                      <div className="player-cell">
                        <Flag code={p.countryCode} name={p.nationalityName} />
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-xs flex gap-1.5 mt-0.5">
                            <span className="pos-chip-sm">{p.primaryPosition}</span>
                            {p.positions.filter(pos => pos !== p.primaryPosition).slice(0, 2).map(pos => (
                              <span key={pos} className="pos-chip-sm text-gray-400 bg-gray-800">{pos}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold text-center">{p.age}</td>
                    <td className="text-muted text-xs">{p.birthDateStr || '-'}</td>
                    <td className="text-center">
                      <RatingBadge val={p.overall} />
                    </td>
                    <td className="text-center">
                      <RatingBadge val={p.potential} isPot />
                    </td>
                    <td className="text-center">
                      {p.growthDiff > 0 ? (
                        <span className="text-emerald-400 font-semibold">+{p.growthDiff}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.pac >= 85 ? '#10b981' : p.pac >= 75 ? '#84cc16' : '#94a3b8' }}>{p.pac || '-'}</span>
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.sho >= 85 ? '#10b981' : p.sho >= 75 ? '#84cc16' : '#94a3b8' }}>{p.sho || '-'}</span>
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.pas >= 85 ? '#10b981' : p.pas >= 75 ? '#84cc16' : '#94a3b8' }}>{p.pas || '-'}</span>
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.dri >= 85 ? '#10b981' : p.dri >= 75 ? '#84cc16' : '#94a3b8' }}>{p.dri || '-'}</span>
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.def >= 85 ? '#10b981' : p.def >= 75 ? '#84cc16' : '#94a3b8' }}>{p.def || '-'}</span>
                    </td>
                    <td className="text-center font-mono text-xs">
                      <span style={{ color: p.phy >= 85 ? '#10b981' : p.phy >= 75 ? '#84cc16' : '#94a3b8' }}>{p.phy || '-'}</span>
                    </td>
                    <td>
                      <div className="text-white text-sm">{p.teamName}</div>
                      <div className="text-xs text-gray-500">{p.leagueName}</div>
                    </td>
                    <td className="font-mono text-sm">{p.formattedWage}</td>
                    <td className="font-mono text-sm text-emerald-400 font-semibold">{p.formattedValue}</td>
                    <td className="text-xs text-gray-400">{p.contractExpiry || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <span className="page-info">
              Sayfa <strong>{currentPage}</strong> / {totalPages}
            </span>
            <div className="pagination-buttons">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="page-btn"
              >
                <ChevronLeft size={16} /> Önceki
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="page-btn"
              >
                Sonraki <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
