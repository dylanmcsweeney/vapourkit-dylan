import { useState, useEffect, useCallback, useRef } from 'react';

interface DevConsoleLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export const useConsoleLog = () => {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addConsoleLog = useCallback((message: string): void => {
    setConsoleOutput(prev => {
      const newLog = `[${new Date().toLocaleTimeString()}] ${message}`;
      const updated = [...prev, newLog];
      // Keep only the last 300 lines
      return updated.length > 300 ? updated.slice(-300) : updated;
    });
  }, []);

  // Listen for developer console logs from backend
  useEffect(() => {
    const unsubscribe = window.electronAPI.onDevConsoleLog((log: DevConsoleLog) => {
      const levelPrefix = log.level === 'error' ? '❌' : 
                         log.level === 'warn' ? '⚠️' : 
                         log.level === 'debug' ? '🔍' : 'ℹ️';
      addConsoleLog(`${levelPrefix} [${log.level.toUpperCase()}] ${log.message}`);
    });

    return () => {
      // Cleanup listener if the API provides an unsubscribe method
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [addConsoleLog]);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput]);

  return {
    consoleOutput,
    consoleEndRef,
    addConsoleLog,
  };
};
