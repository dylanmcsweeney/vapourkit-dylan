// src/hooks/useQueueState.ts - Queue UI state management

import { useState } from 'react';

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

export function useQueueState() {
  const [showQueue, setShowQueue] = useState(false);
  const [editingQueueItemId, setEditingQueueItemId] = useState<string | null>(null);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isQueueStarted, setIsQueueStarted] = useState(false);
  const [isQueueStopping, setIsQueueStopping] = useState(false);
  const [isProcessingQueueItem, setIsProcessingQueueItem] = useState(false);

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
      setShowQueue,
      setEditingQueueItemId,
      setIsProcessingQueue,
      setIsQueueStarted,
      setIsQueueStopping,
      setIsProcessingQueueItem,
    },
  };
}
