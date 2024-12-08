'use client';

import { useArchethic } from '@/hooks/useArchethic';

export function ArchethicProvider({ children }: { children: React.ReactNode }) {
  useArchethic();
  return <>{children}</>;
}