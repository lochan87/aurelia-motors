import { Info, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { VehicleImageSummary } from '@aurelia/shared';

interface VehicleGalleryProps {
  images: VehicleImageSummary[];
  modelName: string;
}

export function VehicleGallery({ images, modelName }: VehicleGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[selectedIndex] ?? images[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Display */}
      <div className="relative aspect-16/10 w-full overflow-hidden border border-ink-950/10 bg-sand-200/50 shadow-sm">
        <img
          src={activeImage.url}
          alt={activeImage.altText}
          className="h-full w-full object-cover transition-all duration-300"
        />

        {/* Artwork badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-ivory-50/20 bg-ink-950/80 px-3 py-1 text-[0.55rem] font-medium tracking-[0.16em] text-ivory-50 uppercase backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-brass-300" aria-hidden="true" />
          Illustrative Artwork · Not a Photograph
        </div>
      </div>

      {/* Caption & Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-md border border-ink-950/10 bg-ivory-100/70 p-3 text-[0.65rem] leading-5 text-stone-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-500" aria-hidden="true" />
        <p>
          {activeImage.caption ||
            `Original illustrative profile for ${modelName}. Drawings and visual mockups are stylized representations for catalogue exploration.`}
        </p>
      </div>

      {/* Thumbnail Selection */}
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`group relative aspect-16/10 overflow-hidden border text-left transition-all ${
                  isSelected
                    ? 'border-brass-500 ring-2 ring-brass-500/20'
                    : 'border-ink-950/10 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View ${image.caption || `image ${index + 1}`}`}
              >
                <img src={image.url} alt={image.altText} className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-ink-950/80 px-2 py-1 text-center text-[0.52rem] font-semibold tracking-[0.16em] text-ivory-50 uppercase">
                  {image.url.includes('interior') ? 'Interior' : 'Exterior'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
