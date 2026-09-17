import { useEffect, useState } from 'react';

export function useEngine() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = engine.subscribe(() => setTick((t) => t + 1));
    engine.start();
    return () => {
      unsub();
      engine.stop();
    };
  }, []);
}

// imported lazily to avoid circular deps
import { engine } from '@/lib/engine';
