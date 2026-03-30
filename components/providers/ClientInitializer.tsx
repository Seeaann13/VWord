'use client';

import { useEffect } from 'react';
import { checkAndCompress } from '@/lib/db';

export default function ClientInitializer() {
  useEffect(() => {
    // Check and compress data on app start
    checkAndCompress().catch(console.error);
  }, []);

  return null;
}
