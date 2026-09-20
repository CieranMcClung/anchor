import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import { loadState, saveState } from '../utils/storage';

export function usePersistedState() {
  const [state, setState] = useState<AppState>(() => loadState());
  const ready = useRef(false);

  useEffect(() => {
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater);
  }, []);

  const patch = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return { state, setState, update, patch };
}
