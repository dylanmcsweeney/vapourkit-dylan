import { useState, useEffect, useCallback } from 'react';

export const useProcessingConfig = (isSetupComplete: boolean) => {
  const [ffmpegArgs, setFfmpegArgs] = useState<string>('');
  const [processingFormat, setProcessingFormat] = useState<string>('vs.YUV420P8');
  const [videoCompareArgs, setVideoCompareArgs] = useState<string>('-W');

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const argsResult = await window.electronAPI.getFfmpegArgs();
        setFfmpegArgs(argsResult.args);
        
        const formatResult = await window.electronAPI.getProcessingFormat();
        setProcessingFormat(formatResult.format);

        const videoCompareResult = await window.electronAPI.getVideoCompareArgs();
        setVideoCompareArgs(videoCompareResult.args);
      } catch (error) {
        console.error('Failed to load processing config:', error);
      }
    };
    
    if (isSetupComplete) {
      loadConfig();
    }
  }, [isSetupComplete]);

  const handleUpdateFfmpegArgs = useCallback(async (args: string): Promise<void> => {
    try {
      setFfmpegArgs(args);
      await window.electronAPI.setFfmpegArgs(args);
    } catch (error) {
      console.error('Error updating FFmpeg args:', error);
    }
  }, []);

  const handleResetFfmpegArgs = useCallback(async (): Promise<void> => {
    try {
      const result = await window.electronAPI.getDefaultFfmpegArgs();
      setFfmpegArgs(result.args);
      await window.electronAPI.setFfmpegArgs(result.args);
    } catch (error) {
      console.error('Error resetting FFmpeg args:', error);
    }
  }, []);

  const handleUpdateProcessingFormat = useCallback(async (format: string): Promise<void> => {
    try {
      setProcessingFormat(format);
      await window.electronAPI.setProcessingFormat(format);
    } catch (error) {
      console.error('Error updating processing format:', error);
    }
  }, []);

  const handleUpdateVideoCompareArgs = useCallback(async (args: string): Promise<void> => {
    try {
      setVideoCompareArgs(args);
      await window.electronAPI.setVideoCompareArgs(args);
    } catch (error) {
      console.error('Error updating video compare args:', error);
    }
  }, []);

  const handleResetVideoCompareArgs = useCallback(async (): Promise<void> => {
    try {
      const result = await window.electronAPI.getDefaultVideoCompareArgs();
      setVideoCompareArgs(result.args);
      await window.electronAPI.setVideoCompareArgs(result.args);
    } catch (error) {
      console.error('Error resetting video compare args:', error);
    }
  }, []);

  return {
    ffmpegArgs,
    processingFormat,
    videoCompareArgs,
    handleUpdateFfmpegArgs,
    handleResetFfmpegArgs,
    handleUpdateProcessingFormat,
    handleUpdateVideoCompareArgs,
    handleResetVideoCompareArgs
  };
};
