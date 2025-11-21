// src/hooks/useQueueEditing.ts - Queue item editing effects

import { useEffect } from 'react';

interface UseQueueEditingOptions {
  editingQueueItemId: string | null;
  showQueue: boolean;
  selectedModel: string | null;
  filters: any[];
  outputFormat: string;
  useDirectML: boolean;
  numStreams: number;
  setEditingQueueItemId: (id: string | null) => void;
  updateItemWorkflow: (id: string, workflow: any) => void;
  onLog: (message: string) => void;
}

export function useQueueEditing(options: UseQueueEditingOptions) {
  const {
    editingQueueItemId,
    showQueue,
    selectedModel,
    filters,
    outputFormat,
    useDirectML,
    numStreams,
    setEditingQueueItemId,
    updateItemWorkflow,
    onLog,
  } = options;

  // Auto-save workflow changes when editing a queue item
  useEffect(() => {
    if (!editingQueueItemId) return;
    
    const currentWorkflowSnapshot = {
      selectedModel,
      filters: JSON.parse(JSON.stringify(filters)),
      outputFormat,
      useDirectML,
      numStreams,
    };
    
    // Debounce auto-save to avoid excessive updates
    const timeoutId = setTimeout(() => {
      updateItemWorkflow(editingQueueItemId, currentWorkflowSnapshot);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [editingQueueItemId, selectedModel, filters, outputFormat, useDirectML, numStreams, updateItemWorkflow]);

  // Close editing mode when queue panel closes
  useEffect(() => {
    if (!showQueue && editingQueueItemId) {
      setEditingQueueItemId(null);
      onLog('Exited queue item editing mode');
    }
  }, [showQueue, editingQueueItemId, setEditingQueueItemId, onLog]);
}
