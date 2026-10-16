import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileCheck,
  AlertCircle,
  Play,
  Sparkles,
  FolderOpen,
  Shield,
  Trash2,
  Calendar,
  HardDrive,
  User,
  Plus
} from 'lucide-react';
import { getSavedSlots, deleteSlot } from '../services/cacheService';

export default function UploadZone({ onStartParsing, onLoadFromSlot, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const inputRef = useRef(null);

  // Load existing slots from IndexedDB
  const refreshSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const data = await getSavedSlots();
      setSlots(data);
    } catch (err) {
      console.warn('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    refreshSlots();
  }, []);

  const handleFile = async (file) => {
    setFileError(null);
    if (!file) return;

    if (file.size < 1000000) {
      setFileError('Seçilen dosya çok küçük. Lütfen geçerli bir EA Sports FC Kariyer save dosyası seçin (CmMgrC... veya Career...).');
      return;
    }

    try {
      const headerSlice = await file.slice(0, 8).arrayBuffer();
      const headerStr = String.fromCharCode(...new Uint8Array(headerSlice));
      if (!headerStr.startsWith('FBCHUNKS')) {
        setFileError('Uyarı: Bu dosya Frostbite "FBCHUNKS" formatında görünmüyor. Yine de devam edebilirsiniz.');
      }
    } catch (e) {
      // ignore
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleStart = () => {
    if (selectedFile) {
      onStartParsing(selectedFile);
    }
  };

  const handleDeleteSlot = async (slotId, e) => {
    e.stopPropagation();
    if (window.confirm(`Slot ${slotId} içeriğini silmek istediğinizden emin misiniz?`)) {
      await deleteSlot(slotId);
      await refreshSlots();
    }
  };

  return (
    <div className="upload-page-container">
      {/* Hero Header */}
      <div className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} className="text-emerald-400" />
          <span>SCOUTMANAGER • EA SPORTS FC 26 CAREER TRACKER</span>
        </div>
        <h1 className="hero-title">
          Kariyer Modu Save Dosyalarınızı <span className="gradient-text">Yönetin & Analiz Edin</span>
        </h1>
        <p className="hero-desc">
          Save dosyanızı yükleyerek anında as & yedek kadronuzu, potansiyelleri ve 20.000+ oyuncuyu SoFIFA
          derinliğinde keşfedin. 5 adede kadar farklı kariyer save dosyanızı depolayabilir ve anında geçiş yapabilirsiniz.
        </p>
      </div>

      {/* Main 2-Column Split Grid */}
      <div className="upload-split-grid">
        {/* SOL BÖLÜM: Save Dosyası Giriş / Yükleme Alanı */}
        <div className="split-column left-upload-pane">
          <div className="pane-header">
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-emerald-400" />
              <h3 className="pane-title">Yeni Save Dosyası Yükle</h3>
            </div>
            <span className="pane-subtitle">Bilgisayarınızdaki güncel save'i seçin</span>
          </div>

          <div
            className={`dropzone-card ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              id="file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />

            {!selectedFile ? (
              <div className="dropzone-content">
                <div className="upload-icon-circle">
                  <Upload size={32} className="text-emerald-400 animate-bounce-subtle" />
                </div>
                <h3>Save Dosyanızı Buraya Bırakın</h3>
                <p className="dropzone-sub">
                  veya aşağıdaki butonla dosya seçin
                </p>
                <div className="path-hint mb-3">
                  <span>Konum: <code>Belgeler\FC 26\settings\CmMgrC...</code></span>
                </div>

                <div className="mt-2 flex flex-col items-center gap-2 w-full">
                  <button
                    type="button"
                    id="btn-choose-file"
                    onClick={() => inputRef.current?.click()}
                    className="btn-change-file w-full justify-center"
                    style={{ padding: '10px 20px', fontSize: '13px' }}
                  >
                    <FolderOpen size={16} className="inline mr-2" /> Bilgisayardan Dosya Seç
                  </button>

                  <button
                    type="button"
                    id="btn-sample-demo"
                    onClick={async () => {
                      try {
                        const resp = await fetch('./sample_save');
                        const blob = await resp.blob();
                        const sampleFile = new File([blob], 'CmMgrC20261011014327769', { type: 'application/octet-stream' });
                        setSelectedFile(sampleFile);
                        onStartParsing(sampleFile);
                      } catch (err) {
                        console.error('Failed to load sample save:', err);
                      }
                    }}
                    disabled={isLoading}
                    className="btn-sample-demo w-full justify-center"
                  >
                    <Sparkles size={14} /> Klasördeki Örnek Save ile Hemen Dene (Başakşehir)
                  </button>
                </div>
              </div>
            ) : (
              <div className="selected-file-box">
                <div className="file-info-row">
                  <div className="file-icon-box">
                    <FileCheck size={28} className="text-emerald-400" />
                  </div>
                  <div className="file-details">
                    <h4>{selectedFile.name}</h4>
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • FC Kariyer Save Dosyası</span>
                  </div>
                </div>

                <div className="action-button-row w-full">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="btn-change-file flex-1"
                  >
                    Farklı Dosya Seç
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStart(); }}
                    disabled={isLoading}
                    className="btn-parse-start flex-1"
                  >
                    <Play size={16} fill="currentColor" /> Analiz Et & Başlat
                  </button>
                </div>
              </div>
            )}
          </div>

          {fileError && (
            <div className="file-warning-banner mt-3">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {/* SAĞ BÖLÜM: Kayıtlı Kariyerler (5 Save Slotu) */}
        <div className="split-column right-slots-pane">
          <div className="pane-header">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-blue-400" />
              <h3 className="pane-title">Kayıtlı Kariyerler (Save Slotları)</h3>
            </div>
            <span className="pane-subtitle">Maksimum 5 adede kadar kariyerinizi depolayın</span>
          </div>

          <div className="slots-list-container">
            {isLoadingSlots ? (
              <div className="slots-loading-text">Kayıtlı slotlar yükleniyor...</div>
            ) : (
              slots.map((slot) => {
                if (slot.isEmpty) {
                  return (
                    <div
                      key={slot.slotId}
                      className="save-slot-card empty-slot"
                      onClick={() => inputRef.current?.click()}
                    >
                      <div className="slot-badge">Slot {slot.slotId}</div>
                      <div className="empty-slot-content">
                        <Plus size={18} className="text-gray-500 mb-1" />
                        <span className="empty-title">Boş Slot {slot.slotId}</span>
                        <span className="empty-desc">Yeni save dosyası yükleyerek bu slota kaydedebilirsiniz</span>
                      </div>
                    </div>
                  );
                }

                const dateStr = slot.timestamp
                  ? new Date(slot.timestamp).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-';

                return (
                  <div
                    key={slot.slotId}
                    className="save-slot-card active-slot"
                    onClick={() => onLoadFromSlot && onLoadFromSlot(slot.data)}
                  >
                    <div className="slot-badge-filled">Slot {slot.slotId}</div>
                    <div className="slot-main-content">
                      <div className="slot-club-row">
                        <Shield size={20} className="text-emerald-400 flex-shrink-0" />
                        <div className="slot-club-name">{slot.clubName}</div>
                      </div>

                      <div className="slot-meta-row">
                        <span><User size={12} className="inline mr-1" />{slot.managerName}</span>
                        <span className="sub-dot">•</span>
                        <span>{slot.season}. Sezon</span>
                        <span className="sub-dot">•</span>
                        <span><Calendar size={12} className="inline mr-1" />{dateStr}</span>
                      </div>
                    </div>

                    <div className="slot-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onLoadFromSlot) onLoadFromSlot(slot.data);
                        }}
                        className="slot-load-btn"
                        title="Bu Kariyeri Aç"
                      >
                        <Play size={13} fill="currentColor" /> Aç
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlot(slot.slotId, e)}
                        className="slot-delete-btn"
                        title="Bu Slotu Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Feature cards below */}
      <div className="feature-cards-grid mt-8">
        <div className="feature-card">
          <h4>⚡ %100 Yerel & Gizli</h4>
          <p>Dosyalarınız tarayıcınızın güvenli depolama alanında tutulur, hiçbir üçüncü taraf sunucuya sızmaz.</p>
        </div>
        <div className="feature-card">
          <h4>🗂️ 5 Adet Save Hafızası</h4>
          <p>Farklı kulüplerle oynadığınız 5 ayrı kariyer modunu slotlara kaydedip tek tıkla aralarında geçiş yapın.</p>
        </div>
        <div className="feature-card">
          <h4>🔍 20.000+ Oyuncu & SoFIFA Gücü</h4>
          <p>Tüm dünya ligleri, potansiyeller, gerçekçi maaşlar ve 6 ana kart puanı elinizin altında.</p>
        </div>
      </div>
    </div>
  );
}
