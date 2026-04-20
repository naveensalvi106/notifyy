import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'NotifyMediaDB';
const STORE_NAME = 'media';
const DB_VERSION = 1;

export interface StoredMedia {
  id: string;
  blob: Blob;
  name: string;
  type: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveLocalMedia = async (file: File | Blob, name: string): Promise<string> => {
  const db = await openDB();
  const id = `local-${uuidv4()}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const media: StoredMedia = { id, blob: file, name, type: file.type };
    const request = store.add(media);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getLocalMedia = async (id: string): Promise<StoredMedia | null> => {
  if (!id.startsWith('local-')) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteLocalMedia = async (id: string): Promise<void> => {
  if (!id.startsWith('local-')) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
