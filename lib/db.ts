import { openDB, IDBPDatabase } from 'idb';

export interface Word {
  id?: number;
  word: string;
  translation: string;
  phonetic: string;
  example: string;
  sourceImage: string; // Base64 or Blob URL
  status: 'New' | 'Learning' | 'Mastered';
  createdAt: Date;
}

const DB_NAME = 'vocab-db';
const STORE_NAME = 'words';

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function addWord(word: Omit<Word, 'id' | 'createdAt'>) {
  const db = await getDB();
  return db.add(STORE_NAME, { ...word, createdAt: new Date(), status: 'New' });
}

export async function getAllWords(): Promise<Word[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function updateWordStatus(id: number, status: Word['status']) {
  const db = await getDB();
  const word = await db.get(STORE_NAME, id);
  if (word) {
    word.status = status;
    await db.put(STORE_NAME, word);
  }
}

export async function deleteWord(id: number) {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
}
