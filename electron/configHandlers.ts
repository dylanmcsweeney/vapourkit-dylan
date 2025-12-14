import { ipcMain, BrowserWindow, app } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from './logger';
import { configManager } from './configManager';
import { VS_MLRT_VERSION, PATHS } from './constants';

/**
 * Registers all configuration-related IPC handlers
 */
export function registerConfigHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle('get-color-matrix-settings', async () => {
    const settings = configManager.getColorMatrixSettings();
    return settings;
  });

  ipcMain.handle('set-color-matrix-settings', async (event, settings: { 
    overwriteMatrix: boolean; 
    matrix709: boolean; 
    defaultMatrix: '709' | '170m'; 
    defaultPrimaries: '709' | '601'; 
    defaultTransfer: '709' | '170m' 
  }) => {
    logger.info(`Setting color matrix: overwrite=${settings.overwriteMatrix}, matrix709=${settings.matrix709}, default=${settings.defaultMatrix}`);
    await configManager.setColorMatrixSettings(settings);
    return { success: true };
  });

  ipcMain.handle('get-panel-sizes', async () => {
    const sizes = configManager.getPanelSizes();
    return sizes;
  });

  ipcMain.handle('set-panel-sizes', async (event, sizes: { leftPanel: number; rightPanel: number; queuePanel?: number }) => {
    logger.debug(`Setting panel sizes: left=${sizes.leftPanel}, right=${sizes.rightPanel}, queue=${sizes.queuePanel}`);
    await configManager.setPanelSizes(sizes);
    return { success: true };
  });

  ipcMain.handle('get-show-queue', async () => {
    const show = configManager.getShowQueue();
    return { show };
  });

  ipcMain.handle('set-show-queue', async (event, show: boolean) => {
    logger.debug(`Setting show queue: ${show}`);
    await configManager.setShowQueue(show);
    return { success: true };
  });

  ipcMain.handle('get-filter-presets', async () => {
    const presets = configManager.getFilterPresets();
    return presets;
  });

  ipcMain.handle('set-filter-presets', async (event, presets: { prefilterPreset: string; postfilterPreset: string }) => {
    logger.debug(`Setting filter presets: prefilter=${presets.prefilterPreset}, postfilter=${presets.postfilterPreset}`);
    await configManager.setFilterPresets(presets);
    return { success: true };
  });

  ipcMain.handle('get-filter-configurations', async () => {
    const filters = configManager.getFilterConfigurations();
    return filters;
  });

  ipcMain.handle('set-filter-configurations', async (event, filters: any[]) => {
    logger.debug(`Setting filter configurations: ${filters.length} filters`);
    await configManager.setFilterConfigurations(filters);
    return { success: true };
  });

  ipcMain.handle('get-ffmpeg-args', async () => {
    const args = configManager.getFfmpegArgs();
    return { args };
  });

  ipcMain.handle('set-ffmpeg-args', async (event, args: string) => {
    logger.info(`Setting ffmpeg args: ${args}`);
    await configManager.setFfmpegArgs(args);
    return { success: true };
  });

  ipcMain.handle('get-default-ffmpeg-args', async () => {
    const args = configManager.getDefaultFfmpegArgs();
    return { args };
  });

  ipcMain.handle('get-output-format', async () => {
    const format = configManager.getOutputFormat();
    return { format };
  });

  ipcMain.handle('set-output-format', async (event, format: string) => {
    logger.info(`Setting output format: ${format}`);
    await configManager.setOutputFormat(format);
    return { success: true };
  });

  ipcMain.handle('get-processing-format', async () => {
    const format = configManager.getProcessingFormat();
    return { format };
  });

  ipcMain.handle('set-processing-format', async (event, format: string) => {
    logger.info(`Setting processing format: ${format}`);
    await configManager.setProcessingFormat(format);
    return { success: true };
  });

  ipcMain.handle('get-video-compare-args', async () => {
    const args = configManager.getVideoCompareArgs();
    return { args };
  });

  ipcMain.handle('set-video-compare-args', async (event, args: string) => {
    logger.info(`Setting video compare args: ${args}`);
    await configManager.setVideoCompareArgs(args);
    return { success: true };
  });

  ipcMain.handle('get-default-video-compare-args', async () => {
    const args = configManager.getDefaultVideoCompareArgs();
    return { args };
  });

  ipcMain.handle('get-version', async () => {
    return { version: app.getVersion() };
  });

  ipcMain.handle('reload-backend', async () => {
    logger.info('Reloading backend (models and configs)');
    try {
      // Reload config manager
      await configManager.load();
      logger.info('Config reloaded');
      
      // Models will be refreshed by the frontend calling get-available-models
      logger.info('Backend reload complete');
      
      return { success: true };
    } catch (error) {
      logger.error('Error reloading backend:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  });

  ipcMain.handle('file-exists', async (event, filePath: string) => {
    logger.debug(`Checking if file exists: ${filePath}`);
    try {
      const fs = require('fs');
      const exists = fs.existsSync(filePath);
      logger.debug(`File exists: ${exists}`);
      return exists;
    } catch (error) {
      logger.error('Error checking file existence:', error);
      return false;
    }
  });

  // vs-mlrt version check - returns info about version mismatch and existing engines
  ipcMain.handle('check-vsmlrt-version', async () => {
    try {
      const storedVersion = configManager.getVsMlrtVersion();
      const currentVersion = VS_MLRT_VERSION;
      const hasVersionMismatch = storedVersion !== undefined && storedVersion !== currentVersion;
      
      // Count existing engine files
      let engineCount = 0;
      if (await fs.pathExists(PATHS.MODELS)) {
        const files = await fs.readdir(PATHS.MODELS);
        engineCount = files.filter((f: string) => f.endsWith('.engine')).length;
      }
      
      logger.info(`vs-mlrt version check: stored=${storedVersion}, current=${currentVersion}, mismatch=${hasVersionMismatch}, engines=${engineCount}`);
      
      return {
        storedVersion,
        currentVersion,
        hasVersionMismatch,
        engineCount,
        needsNotification: hasVersionMismatch && engineCount > 0
      };
    } catch (error) {
      logger.error('Error checking vs-mlrt version:', error);
      return {
        storedVersion: undefined,
        currentVersion: VS_MLRT_VERSION,
        hasVersionMismatch: false,
        engineCount: 0,
        needsNotification: false
      };
    }
  });

  // Clear all engine files
  ipcMain.handle('clear-engine-files', async () => {
    try {
      if (!await fs.pathExists(PATHS.MODELS)) {
        return { success: true, deletedCount: 0 };
      }
      
      const files = await fs.readdir(PATHS.MODELS);
      const engineFiles = files.filter((f: string) => f.endsWith('.engine'));
      
      for (const engineFile of engineFiles) {
        const enginePath = path.join(PATHS.MODELS, engineFile);
        await fs.remove(enginePath);
        logger.info(`Deleted engine file: ${engineFile}`);
      }
      
      logger.info(`Cleared ${engineFiles.length} engine files`);
      return { success: true, deletedCount: engineFiles.length };
    } catch (error) {
      logger.error('Error clearing engine files:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg, deletedCount: 0 };
    }
  });

  // Update stored vs-mlrt version to current
  ipcMain.handle('update-vsmlrt-version', async () => {
    try {
      await configManager.setVsMlrtVersion(VS_MLRT_VERSION);
      logger.info(`Updated stored vs-mlrt version to ${VS_MLRT_VERSION}`);
      return { success: true, version: VS_MLRT_VERSION };
    } catch (error) {
      logger.error('Error updating vs-mlrt version:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  });

  // Automatically update vs-mlrt plugin when version changes
  ipcMain.handle('update-vsmlrt-plugin', async (event) => {
    try {
      logger.info('=== Starting automatic vs-mlrt plugin update ===');
      
      // Import utils to check CUDA support
      const { detectCudaSupport } = await import('./utils');
      const hasCuda = await detectCudaSupport();
      
      if (!hasCuda) {
        logger.info('No CUDA detected, skipping vs-mlrt TensorRT plugin update');
        return { success: false, error: 'CUDA not detected. TensorRT plugin requires NVIDIA GPU.' };
      }

      const axios = await import('axios');
      const sevenBin = require('7zip-bin');
      if (sevenBin.path7za.includes('app.asar') && !sevenBin.path7za.includes('app.asar.unpacked')) {
        sevenBin.path7za = sevenBin.path7za.replace('app.asar', 'app.asar.unpacked');
      }
      const _7z = await import('7zip-min');

      // Progress reporting helper
      const sendProgress = (progress: number, message: string) => {
        if (mainWindow) {
          mainWindow.webContents.send('vsmlrt-update-progress', { progress, message });
        }
      };

      sendProgress(5, 'Preparing to download vs-mlrt TensorRT plugin...');

      // Define the component to download
      const urls = [
        `https://github.com/AmusementClub/vs-mlrt/releases/download/v${VS_MLRT_VERSION}/vsmlrt-windows-x64-tensorrt.v${VS_MLRT_VERSION}.7z.001`,
        `https://github.com/AmusementClub/vs-mlrt/releases/download/v${VS_MLRT_VERSION}/vsmlrt-windows-x64-tensorrt.v${VS_MLRT_VERSION}.7z.002`
      ];
      const archiveNames = [`vsmlrt.7z.001`, `vsmlrt.7z.002`];
      const archivePaths: string[] = [];

      // Download all parts
      for (let i = 0; i < urls.length; i++) {
        const archivePath = path.join(PATHS.APP_DATA, archiveNames[i]);
        archivePaths.push(archivePath);
        
        logger.info(`Downloading part ${i + 1}/${urls.length}: ${urls[i]}`);
        sendProgress(10 + (i * 35), `Downloading vs-mlrt plugin (Part ${i + 1}/${urls.length})...`);

        const response = await axios.default({
          method: 'get',
          url: urls[i],
          responseType: 'stream',
          timeout: 300000 // 5 minutes
        });

        const writer = fs.createWriteStream(archivePath);
        const totalLength = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedLength = 0;

        response.data.on('data', (chunk: Buffer) => {
          downloadedLength += chunk.length;
          const partProgress = totalLength > 0 ? (downloadedLength / totalLength) * 35 : 0;
          sendProgress(10 + (i * 35) + partProgress, `Downloading Part ${i + 1}/${urls.length}: ${Math.round((downloadedLength / totalLength) * 100)}%`);
        });

        await new Promise<void>((resolve, reject) => {
          response.data.pipe(writer);
          writer.on('finish', () => resolve());
          writer.on('error', reject);
        });

        logger.info(`Downloaded part ${i + 1} to: ${archivePath}`);
      }

      sendProgress(80, 'Extracting vs-mlrt plugin...');
      logger.info(`Extracting to: ${PATHS.PLUGINS}`);

      // Remove old plugin files first
      const mlrtPluginPath = path.join(PATHS.PLUGINS, 'vsmlrt-cuda');
      if (await fs.pathExists(mlrtPluginPath)) {
        logger.info('Removing old vs-mlrt plugin directory');
        await fs.remove(mlrtPluginPath);
      }

      // Extract using the first part (7zip will automatically find other parts)
      await new Promise<void>((resolve, reject) => {
        (_7z as any).unpack(archivePaths[0], PATHS.PLUGINS, (err: Error) => {
          if (err) {
            logger.error(`Extraction error: ${err.message}`);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      sendProgress(90, 'Cleaning up temporary files...');

      // Clean up all archive parts
      for (const archivePath of archivePaths) {
        await fs.remove(archivePath);
        logger.info(`Removed archive: ${archivePath}`);
      }

      // Update the stored version
      await configManager.setVsMlrtVersion(VS_MLRT_VERSION);
      
      sendProgress(100, 'vs-mlrt plugin updated successfully!');
      logger.info('=== vs-mlrt plugin update completed successfully ===');

      return { success: true, version: VS_MLRT_VERSION };
    } catch (error) {
      logger.error('Error updating vs-mlrt plugin:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg };
    }
  });
}
