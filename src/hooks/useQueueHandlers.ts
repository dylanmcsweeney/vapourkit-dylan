// src/hooks/useQueueHandlers.ts - Queue operation handlers

import type { QueueItem } from '../electron.d';
import { getErrorMessage } from '../types/errors';

interface UseQueueHandlersOptions {
  queue: QueueItem[];
  editingQueueItemId: string | null;
  selectedModel: string | null;
  filters: any[];
  outputFormat: string;
  useDirectML: boolean;
  numStreams: number;
  isProcessingQueueItem: boolean;
  setEditingQueueItemId: (id: string | null) => void;
  setIsQueueStarted: (started: boolean) => void;
  setIsProcessingQueue: (processing: boolean) => void;
  setIsProcessingQueueItem: (processing: boolean) => void;
  setIsQueueStopping: (stopping: boolean) => void;
  setSelectedModel: (model: string) => void;
  setFilters: (filters: any[]) => void;
  setOutputFormat: (format: string) => void;
  toggleDirectML: (value: boolean) => void;
  updateNumStreams: (streams: number) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  updateItemWorkflow: (id: string, workflow: any) => void;
  requeueItem: (id: string) => void;
  loadVideoInfo: (path: string) => Promise<void>;
  setOutputPath: (path: string) => void;
  handleCancelUpscale: () => Promise<void>;
  onLog: (message: string) => void;
}

export function useQueueHandlers(options: UseQueueHandlersOptions) {
  const {
    queue,
    editingQueueItemId,
    selectedModel,
    filters,
    outputFormat,
    useDirectML,
    numStreams,
    isProcessingQueueItem,
    setEditingQueueItemId,
    setIsQueueStarted,
    setIsProcessingQueue,
    setIsProcessingQueueItem,
    setIsQueueStopping,
    setSelectedModel,
    setFilters,
    setOutputFormat,
    toggleDirectML,
    updateNumStreams,
    updateQueueItem,
    updateItemWorkflow,
    requeueItem,
    loadVideoInfo,
    setOutputPath,
    handleCancelUpscale,
    onLog,
  } = options;

  const handleSelectQueueItem = async (itemId: string): Promise<void> => {
    const item = queue.find(q => q.id === itemId);
    if (!item || item.status !== 'pending') return;
    
    // Auto-save current workflow to the currently editing queue item if any
    if (editingQueueItemId) {
      const currentWorkflowSnapshot = {
        selectedModel,
        filters: JSON.parse(JSON.stringify(filters)),
        outputFormat,
        useDirectML,
        numStreams,
      };
      updateItemWorkflow(editingQueueItemId, currentWorkflowSnapshot);
      onLog(`Auto-saved changes to queue item`);
    }
    
    // Load the selected queue item's workflow into main window
    setEditingQueueItemId(itemId);
    setSelectedModel(item.workflow.selectedModel || '');
    setFilters(item.workflow.filters);
    setOutputFormat(item.workflow.outputFormat);
    toggleDirectML(item.workflow.useDirectML);
    updateNumStreams(item.workflow.numStreams);
    
    // Load video info and output path
    try {
      await loadVideoInfo(item.videoPath);
      setOutputPath(item.outputPath);
      onLog(`Loaded queue item for editing: ${item.videoName}`);
    } catch (error) {
      onLog(`Error loading queue item: ${getErrorMessage(error)}`);
    }
  };

  const handleStartQueue = (): void => {
    setIsQueueStarted(true);
    onLog('=== Starting queue processing ===');
  };

  const handleStopQueue = async (): Promise<void> => {
    setIsQueueStopping(true);
    onLog('Stopping queue processing...');
    
    // Cancel current processing if any
    if (isProcessingQueueItem) {
      await handleCancelUpscale();
    }
    
    setIsQueueStarted(false);
    setIsProcessingQueue(false);
    setIsProcessingQueueItem(false);
    
    // Reset any processing items back to pending
    const processingItem = queue.find(item => item.status === 'processing');
    if (processingItem) {
      updateQueueItem(processingItem.id, { status: 'pending', progress: 0 });
    }
    
    setIsQueueStopping(false);
    onLog('Queue stopped');
  };

  const handleCancelQueueItem = async (itemId: string): Promise<void> => {
    const item = queue.find(q => q.id === itemId);
    if (!item || item.status !== 'processing') return;
    
    onLog(`Canceling queue item: ${item.videoName}`);
    
    // Cancel the current upscale
    await handleCancelUpscale();
    
    // Mark item as error/canceled
    updateQueueItem(itemId, {
      status: 'error',
      errorMessage: 'Canceled by user',
    });
    
    // Clear the processing flag so next item can start
    setIsProcessingQueueItem(false);
  };

  const handleRequeueItem = (itemId: string): void => {
    requeueItem(itemId);
  };

  return {
    handleSelectQueueItem,
    handleStartQueue,
    handleStopQueue,
    handleCancelQueueItem,
    handleRequeueItem,
  };
}
