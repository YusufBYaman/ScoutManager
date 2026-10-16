/**
 * IndexedDB Multi-Slot & Active Save Service for Career Mode Saves
 * Supports up to 5 individual save slots and instant session recovery.
 */

const DB_NAME = 'FC26_CMTracker_DB';
const DB_VERSION = 2;
const STORE_ACTIVE = 'active_save';
const STORE_SLOTS = 'saved_slots';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
        db.createObjectStore(STORE_ACTIVE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SLOTS)) {
        db.createObjectStore(STORE_SLOTS, { keyPath: 'slotId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Active Session Cache ---

export async function saveActiveSaveToCache(parsedData, meta = {}) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVE);
      const record = {
        id: 'current',
        timestamp: Date.now(),
        fileName: meta.fileName || 'Career_Save',
        fileSize: meta.fileSize || 0,
        clubName: parsedData?.managedClub?.name || '',
        data: parsedData,
      };
      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve(true);
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
    return false;
  }
}

export async function getActiveSaveFromCache() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE, 'readonly');
      const store = tx.objectStore(STORE_ACTIVE);
      const getRequest = store.get('current');
      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return null;
  }
}

export async function clearActiveSaveCache() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVE);
      const delRequest = store.delete('current');
      delRequest.onsuccess = () => resolve(true);
      delRequest.onerror = () => reject(delRequest.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
    return false;
  }
}

// --- 5-Slot Save Management ---

export async function getSavedSlots() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SLOTS, 'readonly');
      const store = tx.objectStore(STORE_SLOTS);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        const records = getAllReq.result || [];
        const slotsMap = {};
        records.forEach((r) => {
          slotsMap[r.slotId] = r;
        });

        // Always return an array of 5 slots (1 to 5)
        const fullSlots = [];
        for (let i = 1; i <= 5; i++) {
          fullSlots.push(
            slotsMap[i] || {
              slotId: i,
              isEmpty: true,
            }
          );
        }
        resolve(fullSlots);
      };

      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB getSavedSlots failed:', err);
    return [1, 2, 3, 4, 5].map((i) => ({ slotId: i, isEmpty: true }));
  }
}

export async function saveToSlot(slotId, parsedData, meta = {}) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SLOTS, 'readwrite');
      const store = tx.objectStore(STORE_SLOTS);

      const record = {
        slotId: Number(slotId),
        isEmpty: false,
        timestamp: Date.now(),
        fileName: meta.fileName || 'Career_Save',
        fileSize: meta.fileSize || 0,
        clubName: parsedData?.managedClub?.name || 'Bilinmeyen Kulüp',
        managerName: parsedData?.managedClub?.managerName || 'Menajer',
        season: parsedData?.managedClub?.season || 1,
        squadCount: parsedData?.managedClub?.squadCount || parsedData?.managedSquad?.length || 0,
        totalSquadWage: parsedData?.managedClub?.totalSquadWage || 0,
        data: parsedData,
      };

      const putReq = store.put(record);
      putReq.onsuccess = () => resolve(record);
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn(`IndexedDB saveToSlot(${slotId}) failed:`, err);
    return null;
  }
}

export async function deleteSlot(slotId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SLOTS, 'readwrite');
      const store = tx.objectStore(STORE_SLOTS);
      const delReq = store.delete(Number(slotId));
      delReq.onsuccess = () => resolve(true);
      delReq.onerror = () => reject(delReq.error);
    });
  } catch (err) {
    console.warn(`IndexedDB deleteSlot(${slotId}) failed:`, err);
    return false;
  }
}

export async function autoSaveToNextAvailableSlot(parsedData, meta = {}) {
  const slots = await getSavedSlots();
  // Check if this club already exists in a slot, update that slot
  const clubName = parsedData?.managedClub?.name;
  if (clubName) {
    const existing = slots.find((s) => !s.isEmpty && s.clubName === clubName);
    if (existing) {
      return await saveToSlot(existing.slotId, parsedData, meta);
    }
  }

  // Otherwise pick the first empty slot
  const empty = slots.find((s) => s.isEmpty);
  const targetSlotId = empty ? empty.slotId : 1;
  return await saveToSlot(targetSlotId, parsedData, meta);
}
