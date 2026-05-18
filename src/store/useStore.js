// Hook-обёртка над глобальным стором.

import { useEffect, useState } from '../h.js';
import { getState, subscribe } from './storage.js';

export function useStore(selector = s => s) {
  const [snapshot, setSnapshot] = useState(() => selector(getState()));
  useEffect(() => {
    return subscribe(s => setSnapshot(selector(s)));
    // selector предполагается стабильным; для простоты не пересортируем dependencies
    // eslint-disable-next-line
  }, []);
  return snapshot;
}
