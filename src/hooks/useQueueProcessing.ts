// src/hooks/useQueueProcessing.ts - Automated queue processing logic

import { useEffect } from 'react';
import type { QueueItem } from '../electron.d';
import { getErrorMessage } from '../types/errors';

interface UseQueueProcessingOptions {
  queue: QueueItem[];
  isQueueStarted: boolean;
  isProcessingQueueItem: boolean;
  isProcessingQueue: boolean;
  isProcessing: boolean;
  upscaleProgress: { percentage?: number } | null;
  setIsProcessingQueue: (processing: boolean) => void;
  setIsProcessingQueueItem: (processing: boolean) => void;
  setIsQueueStarted: (started: boolean) => void;
  setVideoInfo: (info: any) => void;
  setOutputPath: (path: string) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  getNextPendingItem: () => QueueItem | null;
  onLog: (message: string) => void;
}

export function useQueueProcessing(options: UseQueueProcessingOptions) {
  const {
    queue,
    isQueueStarted,
    isProcessingQueueItem,
    isProcessingQueue,
    isProcessing,
    upscaleProgress,
    setIsProcessingQueue,
    setIsProcessingQueueItem,
    setIsQueueStarted,
    setVideoInfo,
    setOutputPath,
    updateQueueItem,
    getNextPendingItem,
    onLog,
  } = options;

  // Process queue sequentially
  useEffect(() => {
    const processNextInQueue = async () => {
      // Don't start new item if already processing one or queue hasn't been started
      if (isProcessingQueueItem || !isQueueStarted) return;
      
      const nextItem = getNextPendingItem();
      if (!nextItem) {
        // Queue finished
        if (isProcessingQueue) {
          setIsProcessingQueue(false);
          setIsQueueStarted(false);
          onLog('=== Queue processing completed ===');
        }
        return;
      }

      // Mark as processing queue
      if (!isProcessingQueue) {
        setIsProcessingQueue(true);
      }

      // Set flag to prevent processing multiple items at once
      setIsProcessingQueueItem(true);

      // Update item status to processing
      updateQueueItem(nextItem.id, { status: 'processing', progress: 0 });
      
      try {
        // Load video info and set output path for this item
        const info = await window.electronAPI.getVideoInfo(nextItem.videoPath);
        setVideoInfo(info);
        setOutputPath(nextItem.outputPath);
        onLog(`Loaded queue item: ${nextItem.videoName}`);
        onLog(`Output will be: ${nextItem.outputPath}`);
        
        // Start processing with the item's workflow
        onLog(`Processing queue item: ${nextItem.videoName}`);
        const result = await window.electronAPI.startUpscale(
          nextItem.videoPath,
          nextItem.workflow.selectedModel || '',
          nextItem.outputPath,
          nextItem.workflow.useDirectML,
          true,
          nextItem.workflow.filters,
          0,
          nextItem.workflow.numStreams
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Processing failed');
        }
        
        // Mark as completed
        updateQueueItem(nextItem.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        });
        onLog(`Completed: ${nextItem.videoName}`);
      } catch (error) {
        // Mark as error
        updateQueueItem(nextItem.id, {
          status: 'error',
          errorMessage: getErrorMessage(error),
        });
        onLog(`Error processing ${nextItem.videoName}: ${getErrorMessage(error)}`);
      } finally {
        // Clear flag to allow next item to process
        setIsProcessingQueueItem(false);
      }
    };

    // Try to process next item when queue changes or item finishes processing
    if (isQueueStarted && !isProcessingQueueItem && queue.some(item => item.status === 'pending')) {
      processNextInQueue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, isProcessingQueueItem, isProcessingQueue, isQueueStarted]);

  // Update queue item progress based on upscale progress
  useEffect(() => {
    if (isProcessing && isProcessingQueue && upscaleProgress) {
      const processingItem = queue.find(item => item.status === 'processing');
      if (processingItem && upscaleProgress.percentage !== undefined) {
        updateQueueItem(processingItem.id, { progress: upscaleProgress.percentage });
      }
    }
  }, [upscaleProgress, isProcessing, isProcessingQueue, queue, updateQueueItem]);
}
