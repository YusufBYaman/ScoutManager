import React from 'react';
import { Loader2, Database, Users, Shield, Award, CheckCircle2 } from 'lucide-react';

export default function LoadingScreen({ stage, progress, message }) {
  const steps = [
    { label: 'Save Dosyası & İmzalar', minP: 10 },
    { label: 'Veritabanı Şeması', minP: 25 },
    { label: 'Kariyer & Sözleşmeler', minP: 40 },
    { label: '20.000+ Oyuncu & Takımlar', minP: 65 },
    { label: 'Değerler & Kadro Tamamlama', minP: 90 },
  ];

  return (
    <div className="loading-screen-container">
      <div className="loading-card">
        <div className="spinner-wrapper">
          <Loader2 size={48} className="loading-spinner text-emerald-400" />
        </div>

        <h2 className="loading-title">Kariyer Dosyası Çözümleniyor</h2>
        <p className="loading-subtitle">{message || 'Lütfen bekleyin, veriler işleniyor...'}</p>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          ></div>
        </div>

        <div className="progress-percentage-row">
          <span>İlerleme</span>
          <span className="font-mono font-bold text-emerald-400">{progress}%</span>
        </div>

        {/* Steps List */}
        <div className="loading-steps-list">
          {steps.map((st, i) => {
            const isDone = progress >= st.minP + 15;
            const isCurrent = progress >= st.minP && !isDone;

            return (
              <div
                key={i}
                className={`loading-step-item ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-current' : ''}`}
              >
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className={`step-circle ${isCurrent ? 'active' : ''}`}></div>
                )}
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
