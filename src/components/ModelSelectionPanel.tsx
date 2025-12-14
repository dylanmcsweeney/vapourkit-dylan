import type { ModelFile, ColorMatrixSettings, FilterTemplate, VideoInfo, Filter } from '../electron.d';
import { DynamicFilterPanel } from './DynamicFilterPanel';
import { ColorMatrixPanel } from './ColorMatrixPanel';
import { SegmentSelector, type SegmentSelection } from './SegmentSelector';

interface ModelSelectionPanelProps {
  filteredModels: ModelFile[];
  isProcessing: boolean;
  useDirectML: boolean;
  colorMatrixSettings: ColorMatrixSettings;
  videoInfo: VideoInfo | null;
  filterTemplates: FilterTemplate[];
  filters: Filter[];
  segment?: SegmentSelection;
  onImportClick: () => void;
  onManageModels?: () => void;
  onColorMatrixChange: (settings: ColorMatrixSettings) => void;
  onFiltersChange: (filters: Filter[]) => void;
  onSaveTemplate?: (template: FilterTemplate) => Promise<boolean>;
  onDeleteTemplate?: (name: string) => Promise<boolean>;
  onSegmentChange?: (segment: SegmentSelection) => void;
  onPreviewSegment?: (startFrame: number, endFrame: number) => void;
}

export function ModelSelectionPanel({
  filteredModels,
  isProcessing,
  useDirectML,
  colorMatrixSettings,
  videoInfo,
  filterTemplates,
  filters,
  segment,
  onColorMatrixChange,
  onFiltersChange,
  onSaveTemplate,
  onDeleteTemplate,
  onImportClick,
  onManageModels,
  onSegmentChange,
  onPreviewSegment,
}: ModelSelectionPanelProps) {
  return (
    <>
      {/* Color Matrix Panel */}
      <ColorMatrixPanel
        settings={colorMatrixSettings}
        isProcessing={isProcessing}
        videoInfo={videoInfo}
        onSettingsChange={onColorMatrixChange}
      />

      {/* Segment Selector */}
      {segment && onSegmentChange && (
        <SegmentSelector
          videoInfo={videoInfo}
          segment={segment}
          isProcessing={isProcessing}
          onSegmentChange={onSegmentChange}
          onPreview={onPreviewSegment}
        />
      )}

      {/* Filter Panel */}
      <DynamicFilterPanel
        title="Filters"
        filters={filters}
        filterTemplates={filterTemplates}
        isProcessing={isProcessing}
        availableModels={filteredModels}
        useDirectML={useDirectML}
        onFiltersChange={onFiltersChange}
        onSaveTemplate={onSaveTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onImportClick={onImportClick}
        onManageModels={onManageModels}
      />
    </>
  );
}
