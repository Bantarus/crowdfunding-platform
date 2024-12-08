'use client';

import { useEffect } from 'react';
import { initializeArchethic } from '@/lib/api';

export const useArchethic = (): void => {
  useEffect(() => {
    initializeArchethic().catch(console.error);
  }, []);
};