/**
 * Web Worker for asynchronous background parsing of FC save files
 */
import { findDatabaseOffsets, parseSchemaXml, extractDatabaseTables } from './t3db.js';
import { buildCompleteModels } from './buildModels.js';

self.onmessage = async (e) => {
  const { fileBuffer, xmlText, playernamesText } = e.data;

  try {
    self.postMessage({ stage: 'finding_dbs', progress: 10, message: 'Save dosyası ve DB imzaları taranıyor...' });

    const offsets = findDatabaseOffsets(fileBuffer);
    if (offsets.length < 2) {
      throw new Error(`Geçersiz save dosyası: En az 2 veritabanı bloğu bekleniyordu, ${offsets.length} bulundu.`);
    }

    self.postMessage({ stage: 'parsing_schema', progress: 25, message: 'XML şeması çözümleniyor...' });
    const schema = parseSchemaXml(xmlText);

    self.postMessage({ stage: 'extracting_db1', progress: 40, message: 'Kariyer mod dinamik verileri (sözleşmeler, menajer) okunuyor...' });
    const db1 = extractDatabaseTables(fileBuffer, offsets[0], schema);

    self.postMessage({ stage: 'extracting_db2', progress: 65, message: '20.000+ Oyuncu ve takımlar okunuyor...' });
    const db2 = extractDatabaseTables(fileBuffer, offsets[1], schema, (curr, total) => {
      const p = Math.round(65 + (curr / total) * 15);
      self.postMessage({ stage: 'extracting_db2', progress: p, message: `Tablolar taranıyor (${curr}/${total})...` });
    });

    self.postMessage({ stage: 'parsing_names', progress: 82, message: 'İsim sözlüğü yükleniyor...' });
    const staticNames = {};
    if (playernamesText) {
      const lines = playernamesText.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const commaIdx1 = line.indexOf(',');
        if (commaIdx1 === -1) continue;
        const nid = parseInt(line.substring(0, commaIdx1), 10);
        const commaIdx2 = line.indexOf(',', commaIdx1 + 1);
        const nm = commaIdx2 !== -1 ? line.substring(commaIdx2 + 1).trim() : line.substring(commaIdx1 + 1).trim();
        if (!isNaN(nid) && nm) {
          staticNames[nid] = nm;
        }
      }
    }

    self.postMessage({ stage: 'building_models', progress: 92, message: 'Kadro hiyerarşisi, mevkiler ve değerler birleştiriliyor...' });
    const finalData = buildCompleteModels(db1, db2, staticNames);

    self.postMessage({
      stage: 'done',
      progress: 100,
      message: 'Tamamlandı!',
      data: finalData
    });
  } catch (err) {
    self.postMessage({
      stage: 'error',
      message: err.message || 'Bilinmeyen bir hata oluştu.'
    });
  }
};
