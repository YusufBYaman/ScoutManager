import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import UploadZone from './components/UploadZone';
import LoadingScreen from './components/LoadingScreen';
import SquadView from './components/SquadView';
import AdvancedSearch from './components/AdvancedSearch';
import WonderkidsView from './components/WonderkidsView';
import TeamsView from './components/TeamsView';
import PlayerModal from './components/PlayerModal';
import {
  getActiveSaveFromCache,
  saveActiveSaveToCache,
  clearActiveSaveCache,
  autoSaveToNextAvailableSlot
} from './services/cacheService';

export default function App() {
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStage, setParseStage] = useState('');
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState('');
  const [parseError, setParseError] = useState(null);

  const [activeTab, setActiveTab] = useState('squad');
  const [modalPlayer, setModalPlayer] = useState(null);

  // Restore cached save on mount
  useEffect(() => {
    async function restoreCache() {
      try {
        const cached = await getActiveSaveFromCache();
        if (cached && cached.data) {
          setParsedData(cached.data);
          setActiveTab('squad');
        }
      } catch (err) {
        console.warn('Cache restore skipped:', err);
      }
    }
    restoreCache();
  }, []);

  const handleStartParsing = async (file) => {
    setIsParsing(true);
    setParseError(null);
    setParseProgress(5);
    setParseMessage('Yardımcı veritabanı şemaları yükleniyor...');

    try {
      // 1. Fetch XML and CSV from public
      const [xmlResp, namesResp] = await Promise.all([
        fetch('./fifa_ng_db-meta.xml'),
        fetch('./playernames.csv')
      ]);

      const xmlText = await xmlResp.text();
      const playernamesText = await namesResp.text();

      // 2. Read file as ArrayBuffer
      setParseProgress(10);
      setParseMessage('Save dosyası okunuyor...');
      const fileBuffer = await file.arrayBuffer();

      // 3. Start Web Worker
      const worker = new Worker(new URL('./parser/parser.worker.js', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.stage === 'error') {
          setIsParsing(false);
          setParseError(msg.message || 'Hata oluştu');
          worker.terminate();
        } else if (msg.stage === 'done') {
          setParseProgress(100);
          setParseMessage('Tamamlandı!');
          // Persist to IndexedDB cache and next available slot
          saveActiveSaveToCache(msg.data, { fileName: file.name, fileSize: file.size });
          autoSaveToNextAvailableSlot(msg.data, { fileName: file.name, fileSize: file.size });
          setTimeout(() => {
            setParsedData(msg.data);
            setIsParsing(false);
            setActiveTab('squad');
          }, 350);
          worker.terminate();
        } else {
          setParseStage(msg.stage);
          setParseProgress(msg.progress || 0);
          setParseMessage(msg.message || '');
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setIsParsing(false);
        setParseError('Save dosyası çözülürken bir hata oluştu: ' + err.message);
        worker.terminate();
      };

      worker.postMessage({
        fileBuffer,
        xmlText,
        playernamesText
      });

    } catch (err) {
      console.error(err);
      setIsParsing(false);
      setParseError('Dosya yüklenirken hata oluştu: ' + err.message);
    }
  };

  const handleResetFile = async () => {
    try {
      await clearActiveSaveCache();
    } catch (e) {
      // ignore
    }
    setParsedData(null);
    setIsParsing(false);
    setParseError(null);
    setModalPlayer(null);
  };

  return (
    <div className="app-root">
      {/* Top Header */}
      <Header
        club={parsedData?.managedClub}
        players={parsedData?.players}
        onSelectPlayer={setModalPlayer}
        onResetFile={handleResetFile}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {isParsing ? (
          <LoadingScreen
            stage={parseStage}
            progress={parseProgress}
            message={parseMessage}
          />
        ) : !parsedData ? (
          <UploadZone
            onStartParsing={handleStartParsing}
            onLoadFromSlot={(slotData) => {
              setParsedData(slotData);
              saveActiveSaveToCache(slotData);
              setActiveTab('squad');
            }}
            isLoading={isParsing}
          />
        ) : (
          <div className="dashboard-container">
            {/* Tabs Bar */}
            <Tabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              clubName={parsedData.managedClub?.name}
            />

            {/* Tab Views */}
            <div className="tab-body">
              {activeTab === 'squad' && (
                <SquadView
                  club={parsedData.managedClub}
                  starters={parsedData.starters}
                  substitutes={parsedData.substitutes}
                  onSelectPlayer={setModalPlayer}
                />
              )}

              {activeTab === 'search' && (
                <AdvancedSearch
                  players={parsedData.players}
                  onSelectPlayer={setModalPlayer}
                />
              )}

              {activeTab === 'wonderkids' && (
                <WonderkidsView
                  players={parsedData.players}
                  onSelectPlayer={setModalPlayer}
                />
              )}

              {activeTab === 'teams' && (
                <TeamsView
                  teams={parsedData.teams}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Player Detail Modal */}
      {modalPlayer && (
        <PlayerModal
          player={modalPlayer}
          onClose={() => setModalPlayer(null)}
        />
      )}
    </div>
  );
}
