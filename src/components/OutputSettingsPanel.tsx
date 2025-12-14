// OutputSettingsPanel.tsx
import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import type { VideoInfo } from '../electron.d';
import type { Codec, Preset, Encoder } from '../utils/ffmpegConfig';
import { 
  parseFfmpegArgs, 
  generateFfmpegArgs,
  getRecommendedCrfRange,
  supportsCrf,
  supportsPreset,
  getAvailableEncoders,
  getEncoderDisplayName,
  getEncoderShortName,
  getDefaultPreset,
  getPresetDisplayName
} from '../utils/ffmpegConfig';

interface OutputSettingsPanelProps {
  videoInfo: VideoInfo | null;
  outputPath: string;
  outputFormat: string;
  ffmpegArgs: string;
  isProcessing: boolean;
  onFormatChange: (format: string) => void;
  onSelectOutputFile: () => void;
  onFfmpegArgsChange: (args: string) => void;
}

export function OutputSettingsPanel({
  videoInfo,
  outputPath,
  outputFormat,
  ffmpegArgs,
  isProcessing,
  onFormatChange,
  onSelectOutputFile,
  onFfmpegArgsChange,
}: OutputSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Parse current config from args
  const config = parseFfmpegArgs(ffmpegArgs);
  const isCustom = config.codec === 'custom';

  // If args are custom, default to advanced mode
  React.useEffect(() => {
    if (isCustom && !advancedMode) {
      setAdvancedMode(true);
    }
  }, [isCustom, advancedMode]);

  const handleCodecChange = (codec: Codec) => {
    const crfRange = getRecommendedCrfRange(codec);
    const availableEncodersForCodec = getAvailableEncoders(codec);
    
    // Preserve current encoder if it's available for the new codec, otherwise fall back to software
    const encoder = availableEncodersForCodec.includes(config.encoder) ? config.encoder : 'software' as Encoder;
    
    // Get appropriate default preset for the encoder
    const preset = getDefaultPreset(encoder);
    
    const newConfig = {
      ...config,
      codec,
      encoder,
      crf: crfRange.default,
      preset
    };
    onFfmpegArgsChange(generateFfmpegArgs(newConfig));
  };

  const handleEncoderChange = (encoder: Encoder) => {
    // Update preset to match encoder's defaults
    const preset = getDefaultPreset(encoder);
    const newConfig = { ...config, encoder, preset };
    onFfmpegArgsChange(generateFfmpegArgs(newConfig));
  };

  const handlePresetChange = (preset: Preset) => {
    const newConfig = { ...config, preset };
    onFfmpegArgsChange(generateFfmpegArgs(newConfig));
  };

  const handleCrfChange = (crf: number) => {
    const newConfig = { ...config, crf };
    onFfmpegArgsChange(generateFfmpegArgs(newConfig));
  };

  const handleCustomArgsChange = (args: string) => {
    onFfmpegArgsChange(args);
  };

  const crfRange = getRecommendedCrfRange(config.codec);
  const availableEncoders = getAvailableEncoders(config.codec);

  return (
    <div className="flex-shrink-0 bg-dark-elevated rounded-xl border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isProcessing}
          className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-accent-cyan" />
          <h3 className="text-base font-semibold">Output Settings</h3>
          {!advancedMode && !isCustom && (
            <>
              <span className="text-sm text-primary-purple bg-primary-purple/10 px-2 py-0.5 rounded">
                {config.codec.toUpperCase()}
              </span>
              {availableEncoders.length > 1 && (
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  {getEncoderShortName(config.encoder)}
                </span>
              )}
            </>
          )}
          {advancedMode && (
            <span className="text-sm text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
              Custom
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-auto" />
          )}
        </button>
        
        {/* Advanced Mode Toggle */}
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          disabled={isProcessing}
          className={`ml-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
            advancedMode
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/30'
              : 'bg-dark-surface text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Advanced
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* Output Format & Save Location Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Format
              </label>
              <select
                value={outputFormat}
                onChange={(e) => onFormatChange(e.target.value)}
                disabled={isProcessing}
                className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50 text-base disabled:cursor-not-allowed"
              >
                <option value="mkv">MKV</option>
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="avi">AVI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Save To</label>
              <button
                onClick={onSelectOutputFile}
                disabled={!videoInfo || isProcessing}
                className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 text-left hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm truncate"
              >
                {outputPath ? (
                  <span className="truncate block">{outputPath.split('\\').pop()?.split('/').pop() || outputPath}</span>
                ) : (
                  <span className="text-gray-500">Browse...</span>
                )}
              </button>
            </div>
          </div>

          {/* Simple Mode */}
          {!advancedMode && (
            <>
            {/* Codec Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Video Codec
              </label>
              <select
                value={config.codec === 'custom' ? 'h264' : config.codec}
                onChange={(e) => handleCodecChange(e.target.value as Codec)}
                disabled={isProcessing}
                className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50 text-base disabled:cursor-not-allowed"
              >
                <option value="h264">H.264 (AVC)</option>
                <option value="h265">H.265 (HEVC)</option>
                <option value="av1">AV1</option>
                <option value="prores">ProRes</option>
              </select>
            </div>

            {/* Encoder Selection */}
            {availableEncoders.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Encoder
                </label>
                <select
                  value={config.encoder}
                  onChange={(e) => handleEncoderChange(e.target.value as Encoder)}
                  disabled={isProcessing}
                  className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50 text-base disabled:cursor-not-allowed"
                >
                  {availableEncoders.map((encoder) => (
                    <option key={encoder} value={encoder}>
                      {getEncoderDisplayName(encoder)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preset Selection (not for ProRes) */}
            {supportsPreset(config.codec) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Encoding Speed
                  </label>
                  <span className="text-xs text-gray-500">
                    {getPresetDisplayName(config.preset)}
                  </span>
                </div>
                <select
                  value={config.preset}
                  onChange={(e) => handlePresetChange(e.target.value as Preset)}
                  disabled={isProcessing}
                  className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50 text-base disabled:cursor-not-allowed"
                >
                  {config.encoder === 'nvidia' && (
                    <>
                      <option value="p1">P1 - Fastest</option>
                      <option value="p2">P2 - Faster</option>
                      <option value="p3">P3 - Fast</option>
                      <option value="p4">P4 - Medium</option>
                      <option value="p5">P5 - Slow</option>
                      <option value="p6">P6 - Slower</option>
                      <option value="p7">P7 - Slowest (Recommended)</option>
                    </>
                  )}
                  {config.encoder === 'amd' && (
                    <>
                      <option value="speed">Speed - Fast Encode</option>
                      <option value="balanced">Balanced</option>
                      <option value="quality">Quality - Best (Recommended)</option>
                    </>
                  )}
                  {config.encoder === 'intel' && (
                    <>
                      <option value="veryfast">Very Fast</option>
                      <option value="faster">Faster</option>
                      <option value="fast">Fast</option>
                      <option value="medium">Medium</option>
                      <option value="slow">Slow</option>
                      <option value="slower">Slower</option>
                      <option value="veryslow">Very Slow (Recommended)</option>
                    </>
                  )}
                  {config.encoder === 'software' && (
                    <>
                      <option value="ultrafast">Ultra Fast</option>
                      <option value="superfast">Super Fast</option>
                      <option value="veryfast">Very Fast</option>
                      <option value="faster">Faster</option>
                      <option value="fast">Fast</option>
                      <option value="medium">Medium (Recommended)</option>
                      <option value="slow">Slow</option>
                      <option value="slower">Slower</option>
                      <option value="veryslow">Very Slow</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* CRF Quality (not for ProRes) */}
            {supportsCrf(config.codec) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Quality
                  </label>
                  <span className="text-sm font-medium text-accent-cyan">
                    CRF {config.crf}
                  </span>
                </div>
                <input
                  type="range"
                  min={crfRange.min}
                  max={crfRange.max}
                  value={config.crf}
                  onChange={(e) => handleCrfChange(parseInt(e.target.value, 10))}
                  disabled={isProcessing}
                  className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer accent-accent-cyan disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Best ({crfRange.min})</span>
                  <span>Default ({crfRange.default})</span>
                  <span>Fast ({crfRange.max})</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Advanced Mode - Raw FFmpeg Args */}
        {advancedMode && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              FFmpeg Arguments
            </label>
            <textarea
              value={advancedMode ? ffmpegArgs : generateFfmpegArgs(config)}
              onChange={(e) => handleCustomArgsChange(e.target.value)}
              disabled={isProcessing}
              placeholder="-c:v libx264 -preset medium -crf 18 -map_metadata 1"
              rows={3}
              className="w-full bg-dark-surface border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan transition-colors disabled:opacity-50 text-sm font-mono resize-none"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Custom FFmpeg encoding arguments
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
