import React from 'react';
import { Users, Search, Sparkles, Shield } from 'lucide-react';

export default function Tabs({ activeTab, onTabChange, clubName }) {
  const tabsList = [
    { id: 'squad', label: clubName ? `Kadrom (${clubName})` : 'Kadrom', icon: Users },
    { id: 'search', label: 'Gelişmiş Oyuncu Arama & Filtre', icon: Search },
    { id: 'wonderkids', label: 'Genç Yetenekler (Wonderkids)', icon: Sparkles },
    { id: 'teams', label: 'Tüm Takımlar', icon: Shield },
  ];

  return (
    <div className="tabs-nav-bar">
      <div className="tabs-container">
        {tabsList.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`tab-btn ${isActive ? 'tab-active' : ''}`}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
