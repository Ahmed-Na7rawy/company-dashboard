import { useState, useEffect } from 'react';

export type ScaleMode = 'millions' | 'thousands';

let globalScaleMode: ScaleMode = (localStorage.getItem('company_scale_mode') as ScaleMode) || 'millions';
const listeners = new Set<(mode: ScaleMode) => void>();

export function setGlobalScaleMode(mode: ScaleMode) {
  globalScaleMode = mode;
  localStorage.setItem('company_scale_mode', mode);
  listeners.forEach(l => l(mode));
}

export function useScaleMode(): ScaleMode {
  const [scaleMode, setScaleMode] = useState<ScaleMode>(globalScaleMode);

  useEffect(() => {
    const handleUpdate = (mode: ScaleMode) => setScaleMode(mode);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return scaleMode;
}
