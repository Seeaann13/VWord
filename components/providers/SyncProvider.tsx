'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  onSnapshot, 
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { getAllWords, addWord, getDB } from '@/lib/db';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const isSyncing = useRef(false);

  // Test connection on mount
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'test/connection');
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId || isSyncing.current) return;

    const syncData = async () => {
      isSyncing.current = true;
      console.log('[Sync] Starting cloud backup for user:', userId);

      try {
        // 1. Get local words
        const localWords = await getAllWords();
        
        // 2. Upload local words to Firestore (if not already there)
        const userWordsRef = collection(db, 'users', userId, 'words');
        
        for (const word of localWords) {
          const docId = `${word.word}_${word.createdAt.getTime()}`;
          const wordDocRef = doc(userWordsRef, docId);
          
          try {
            await setDoc(wordDocRef, {
              ...word,
              createdAt: Timestamp.fromDate(new Date(word.createdAt)),
              updatedAt: Timestamp.now(),
            }, { merge: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${userId}/words/${docId}`);
          }
        }

        // 3. Listen for remote changes
        const q = query(userWordsRef);
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const localDB = await getDB();
          const existingLocalWords = await localDB.getAll('words');
          
          for (const change of snapshot.docChanges()) {
            if (change.type === 'added' || change.type === 'modified') {
              const remoteWord = change.doc.data();
              // Check if this word exists locally
              const exists = existingLocalWords.some(w => 
                w.word === remoteWord.word && 
                new Date(w.createdAt).getTime() === remoteWord.createdAt.toDate().getTime()
              );

              if (!exists) {
                console.log('[Sync] New remote word found, adding to local DB:', remoteWord.word);
                await localDB.add('words', {
                  ...remoteWord,
                  createdAt: remoteWord.createdAt.toDate(),
                  id: undefined // Let IndexedDB assign a new ID
                });
              }
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${userId}/words`);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('[Sync] Error during synchronization:', error);
      } finally {
        isSyncing.current = false;
      }
    };

    syncData();
  }, [userId, isLoaded]);

  return <>{children}</>;
}
