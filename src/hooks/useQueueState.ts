// src/hooks/useQueueState.ts - Queue UI state management

import { useState, useEffect } from 'react';

export interface QueueState {
  showQueue: boolean;
  editingQueueItemId: string | null;
  isProcessingQueue: boolean;
  isQueueStarted: boolean;
  isQueueStopping: boolean;
  isProcessingQueueItem: boolean;
}

export interface QueueStateActions {
  setShowQueue: (show: boolean) => void;
  setEditingQueueItemId: (id: string | null) => void;
  setIsProcessingQueue: (processing: boolean) => void;
  setIsQueueStarted: (started: boolean) => void;
  setIsQueueStopping: (stopping: boolean) => void;
  setIsProcessingQueueItem: (processing: boolean) => void;
}

export function useQueueState(onLog?: (message: string) => void) {
  const [showQueue, setShowQueue] = useState(false);
  const [editingQueueItemId, setEditingQueueItemId] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isQueueStarted, setIsQueueStarted] = useState(false);
  const [isQueueStopping, setIsQueueStopping] = useState(false);
  const [isProcessingQueueItem, setIsProcessingQueueItem] = useState(false);

  // Load showQueue state
  useEffect(() => {
    const loadState = async () => {
      try {
        const result = await window.electronAPI.getShowQueue();
        setShowQueue(result.show);
      } catch (error) {
        if (onLog) onLog(`Error loading queue state: ${error}`);
      }
    };
    loadState();
  }, [onLog]);

  const handleSetShowQueue = (show: boolean) => {
    setShowQueue(show);
    window.electronAPI.setShowQueue(show).catch(error => {
      if (onLog) onLog(`Error saving queue state: ${error}`);
    });
  };

  return {
    state: {
      showQueue,
      editingQueueItemId,
      isProcessingQueue,
      isQueueStarted,
      isQueueStopping,
      isProcessingQueueItem,
    },
    actions: {
      setShowQueue: handleSetShowQueue,
      setEditingQueueItemId,
      setIsProcessingQueue,
      setIsQueueStarted,
      setIsQueueStopping,
      setIsProcessingQueueItem,
    },
  };
}
