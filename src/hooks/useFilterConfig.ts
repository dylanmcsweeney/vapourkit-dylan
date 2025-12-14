import { useState, useEffect } from 'react';
import type { Filter } from '../electron.d';
import { getErrorMessage } from '../types/errors';

export function useFilterConfig(
  isSetupComplete: boolean, 
  onLog: (message: string) => void
) {
  const [filters, setFilters] = useState<Filter[]>(() => {
    const saved = localStorage.getItem('filters');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Load filter configurations from backend
  useEffect(() => {
    const loadFilterConfigurations = async () => {
      try {
        const savedFilters = await window.electronAPI.getFilterConfigurations();
        if (savedFilters && savedFilters.length > 0) {
          setFilters(savedFilters);
          onLog(`Loaded ${savedFilters.length} filter configuration(s)`);
        }
      } catch (error) {
        onLog(`Error loading filter configurations: ${getErrorMessage(error)}`);
      }
    };

    if (isSetupComplete) {
      loadFilterConfigurations();
    }
  }, [isSetupComplete, onLog]);

  // Wrapper to persist state changes
  const handleSetFilters = (value: Filter[]) => {
    setFilters(value);
    localStorage.setItem('filters', JSON.stringify(value));
  };

  return {
    filters,
    setFilters,
    handleSetFilters,
  };
}
