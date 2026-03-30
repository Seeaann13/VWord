import { openDB, IDBPDatabase } from 'idb';
import LZString from 'lz-string';

export interface Word {
  id?: number;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  sourceImage: string; // 原始全圖
  sourceSnippet: string; // 核心記憶局部圖 (V-Memory)
  rect?: { x: number, y: number, width: number, height: number }; // 相對於 snippet 的單字位置 (0-1 normalized)
  status: 'New' | 'Learning' | 'Mastered';
  createdAt: Date;
}

export interface CompressedArchive {
  id: string; // 'archive'
  data: string; // LZString compressed JSON
  updatedAt: Date;
}

const DB_NAME = 'vocab-db';
const STORE_NAME = 'words';
const ARCHIVE_STORE = 'archive';

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
        db.createObjectStore(ARCHIVE_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function addWord(word: Omit<Word, 'id' | 'createdAt'>) {
  const db = await getDB();
  updateLastActive();
  return db.add(STORE_NAME, { ...word, createdAt: new Date(), status: 'New' });
}

export async function getAllWords(): Promise<Word[]> {
  const db = await getDB();
  updateLastActive();
  
  const words = await db.getAll(STORE_NAME);
  const archive = await db.get(ARCHIVE_STORE, 'main');
  
  if (archive) {
    const decompressed = LZString.decompressFromUTF16(archive.data);
    if (decompressed) {
      const archivedWords = JSON.parse(decompressed) as Word[];
      return [...words, ...archivedWords];
    }
  }
  
  return words;
}

export async function updateWordStatus(id: number, status: Word['status']) {
  const db = await getDB();
  updateLastActive();
  const word = await db.get(STORE_NAME, id);
  if (word) {
    word.status = status;
    await db.put(STORE_NAME, word);
  }
}

export async function deleteWord(id: number) {
  const db = await getDB();
  updateLastActive();
  return db.delete(STORE_NAME, id);
}

// Inactive Compression Logic
export function updateLastActive() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vlens-last-active', Date.now().toString());
  }
}

export async function checkAndCompress() {
  if (typeof window === 'undefined') return;
  
  const lastActive = localStorage.getItem('vlens-last-active');
  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  
  if (lastActive && (now - parseInt(lastActive)) > ONE_WEEK) {
    console.log('[DB] User inactive for > 1 week. Compressing data...');
    await compressData();
  }
  
  updateLastActive();
}

async function compressData() {
  const db = await getDB();
  const words = await db.getAll(STORE_NAME);
  
  if (words.length === 0) return;
  
  // Get existing archive
  const existingArchive = await db.get(ARCHIVE_STORE, 'main');
  let allWords = words;
  
  if (existingArchive) {
    const decompressed = LZString.decompressFromUTF16(existingArchive.data);
    if (decompressed) {
      const archivedWords = JSON.parse(decompressed);
      allWords = [...archivedWords, ...words];
    }
  }
  
  const compressed = LZString.compressToUTF16(JSON.stringify(allWords));
  
  await db.put(ARCHIVE_STORE, {
    id: 'main',
    data: compressed,
    updatedAt: new Date()
  });
  
  // Clear the active words store to save space
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
  
  console.log(`[DB] Compressed ${allWords.length} words into archive.`);
}
