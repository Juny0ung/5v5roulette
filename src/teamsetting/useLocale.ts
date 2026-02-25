import { useState, useEffect } from 'react';
import { translateText } from '../localization';

export function useTranslate() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('localechange', handler);
    return () => window.removeEventListener('localechange', handler);
  }, []);

  return translateText;
}
