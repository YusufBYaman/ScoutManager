import React from 'react';
import QuickSearch from './QuickSearch';
import { Shield, Upload, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({ club, players, onSelectPlayer, onResetFile, onUpdateCurrentSave }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo-group" onClick={onResetFile} role="button" title="Ana Sayfaya Dön">
          <div className="logo-icon">⚽</div>
          <div className="logo-texts">
            <span className="logo-title">CM TRACKER</span>
            <span className="logo-badge">FC 26</span>
          </div>
        </div>

        {club && (
          <div className="header-club-pill">
            <Shield size={14} className="text-emerald-400" />
            <span className="club-pill-name">{club.name}</span>
            <span className="club-pill-mgr">({club.managerName || 'Menajer'})</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {players && players.length > 0 && (
          <QuickSearch players={players} onSelectPlayer={onSelectPlayer} />
        )}

        {club && onUpdateCurrentSave && (
          <button
            type="button"
            onClick={onUpdateCurrentSave}
            className="header-update-btn"
            title="Kariyer Save Dosyanızı Güncelleyin (Yeni Sezon / Yeni Transferler)"
          >
            <RefreshCw size={14} />
            <span>Save'i Güncelle</span>
          </button>
        )}

        <button
          type="button"
          onClick={onResetFile}
          className="header-upload-btn"
          title="Farklı Bir Save Dosyası Yükle"
        >
          <Upload size={14} />
          <span>Yeni Dosya</span>
        </button>
      </div>
    </header>
  );
}
