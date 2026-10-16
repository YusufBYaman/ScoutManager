import React, { useEffect } from 'react';
import Flag from './Flag';
import RatingBadge from './RatingBadge';
import { X, Calendar, DollarSign, Shield, Award, Sparkles, TrendingUp } from 'lucide-react';

export default function PlayerModal({ player, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const statGroups = [
    {
      title: 'Hız (Pace)',
      color: '#10b981',
      stats: [
        { label: 'Hızlanma', val: player.acceleration },
        { label: 'Sprint Hızı', val: player.sprintSpeed },
      ]
    },
    {
      title: 'Şut (Shooting)',
      color: '#f59e0b',
      stats: [
        { label: 'Bitiricilik', val: player.finishing },
        { label: 'Şut Gücü', val: player.shotPower },
        { label: 'Uzaktan Şut', val: player.longShots },
        { label: 'Voleler', val: player.volleys },
        { label: 'Penaltılar', val: player.penalties },
      ]
    },
    {
      title: 'Pas (Passing)',
      color: '#3b82f6',
      stats: [
        { label: 'Vizyon', val: player.vision },
        { label: 'Kısa Pas', val: player.shortPassing },
        { label: 'Uzun Pas', val: player.longPassing },
        { label: 'Orta Açma', val: player.crossing },
        { label: 'Frikik', val: player.freeKickAccuracy },
        { label: 'Falso', val: player.curve },
      ]
    },
    {
      title: 'Dripling (Dribbling)',
      color: '#8b5cf6',
      stats: [
        { label: 'Top Kontrolü', val: player.ballControl },
        { label: 'Dribling', val: player.dribbling },
        { label: 'Çeviklik', val: player.agility },
        { label: 'Denge', val: player.balance },
        { label: 'Reaksiyon', val: player.reactions },
        { label: 'Soğukkanlılık', val: player.composure },
      ]
    },
    {
      title: 'Defans (Defending)',
      color: '#ef4444',
      stats: [
        { label: 'Savunma Bilinci', val: player.defensiveAwareness },
        { label: 'Top Kesme', val: player.interceptions },
        { label: 'Ayakta Müdahale', val: player.standingTackle },
        { label: 'Kayarak Müdahale', val: player.slidingTackle },
        { label: 'Kafa İsabeti', val: player.headingAccuracy },
      ]
    },
    {
      title: 'Fizik (Physical)',
      color: '#ec4899',
      stats: [
        { label: 'Zıplama', val: player.jumping },
        { label: 'Dayanıklılık', val: player.stamina },
        { label: 'Güç', val: player.strength },
        { label: 'Saldırganlık', val: player.aggression },
      ]
    },
  ];

  const isGoalkeeper = player.primaryPosition === 'GK';
  const gkStats = [
    { label: 'Uçarak Kurtarış', val: player.gkDiving },
    { label: 'Elle Kontrol', val: player.gkHandling },
    { label: 'Degaj', val: player.gkKicking },
    { label: 'Yer Tutma', val: player.gkPositioning },
    { label: 'Refleks', val: player.gkReflexes },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-player-main">
            <div className="modal-avatar">
              <span className="modal-jersey-number">{player.jerseyNumber ? `#${player.jerseyNumber}` : '⚽'}</span>
            </div>
            <div>
              <div className="modal-name-row">
                <Flag code={player.countryCode} name={player.nationalityName} className="modal-flag" />
                <h2 className="modal-player-name">{player.name}</h2>
                <span className="pos-badge primary-pos">{player.primaryPosition}</span>
              </div>
              <div className="modal-sub-info">
                <span>{player.teamName}</span>
                {player.leagueName && <span className="sub-dot">• {player.leagueName}</span>}
                <span className="sub-dot">• {player.loanStatus}</span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Ratings & Key Metrics */}
        <div className="modal-key-metrics">
          <div className="metric-box">
            <span className="metric-title">Genel Reyting</span>
            <div className="metric-val-row">
              <RatingBadge val={player.overall} className="metric-badge" />
            </div>
          </div>

          <div className="metric-box">
            <span className="metric-title">Potansiyel</span>
            <div className="metric-val-row">
              <RatingBadge val={player.potential} isPot className="metric-badge" />
              {player.growthDiff > 0 && (
                <span className="growth-tag">
                  <TrendingUp size={12} /> +{player.growthDiff}
                </span>
              )}
            </div>
          </div>

          <div className="metric-box">
            <span className="metric-title">Tahmini Değer</span>
            <span className="metric-val green-text">{player.formattedValue}</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Haftalık Maaş</span>
            <span className="metric-val">{player.formattedWage}</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Yaş & Doğum</span>
            <span className="metric-val">{player.age} Yaş</span>
            <span className="metric-sub">{player.birthDateStr}</span>
          </div>

          <div className="metric-box">
            <span className="metric-title">Fiziksel & Ayak</span>
            <span className="metric-val">{player.height} cm / {player.weight} kg</span>
            <span className="metric-sub">{player.preferredFoot} • ZA {player.weakFoot}★ • BH {player.skillMoves}★</span>
          </div>
        </div>

        {/* 6-Pillar Card Stats (SoFIFA / FC 26 Style) */}
        {player.pillarStats?.cards && (
          <div className="modal-pillar-grid">
            {player.pillarStats.cards.map((c, idx) => (
              <div key={idx} className="pillar-card-box">
                <span
                  className="pillar-val"
                  style={{
                    color: c.val >= 85 ? '#10b981' : c.val >= 75 ? '#84cc16' : c.val >= 65 ? '#eab308' : '#f97316'
                  }}
                >
                  {c.val}
                </span>
                <span className="pillar-label">{c.label}</span>
                <span className="pillar-name">{c.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* PlayStyles Section */}
        {((player.playstylesPlus && player.playstylesPlus.length > 0) || (player.playstyles && player.playstyles.length > 0)) && (
          <div className="modal-playstyles-section">
            <div className="section-title-row">
              <Sparkles size={16} className="text-yellow-400" />
              <h3>PlayStyles & Yetenekler</h3>
            </div>
            <div className="playstyles-container">
              {player.playstylesPlus?.map((ps, idx) => (
                <span key={`plus-${idx}`} className="playstyle-pill playstyle-plus" title="PlayStyle+">
                  ★ {ps}+
                </span>
              ))}
              {player.playstyles?.map((ps, idx) => (
                <span key={`ps-${idx}`} className="playstyle-pill">
                  {ps}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attributes Breakdown */}
        <div className="modal-stats-grid">
          {isGoalkeeper ? (
            <div className="stat-group-card">
              <h4 style={{ color: '#10b981' }}>Kalecilik Özellikleri</h4>
              <div className="stat-bars">
                {gkStats.map((st, i) => (
                  <div key={i} className="stat-row">
                    <span className="stat-label">{st.label}</span>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${Math.min(100, st.val)}%`, backgroundColor: '#10b981' }}></div>
                    </div>
                    <span className="stat-val">{st.val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            statGroups.map((grp, idx) => (
              <div key={idx} className="stat-group-card">
                <h4 style={{ color: grp.color }}>{grp.title}</h4>
                <div className="stat-bars">
                  {grp.stats.map((st, i) => (
                    <div key={i} className="stat-row">
                      <span className="stat-label">{st.label}</span>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill"
                          style={{
                            width: `${Math.min(100, st.val)}%`,
                            backgroundColor: grp.color
                          }}
                        ></div>
                      </div>
                      <span className="stat-val">{st.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
