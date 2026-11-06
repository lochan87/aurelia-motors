import { ArrowRight, Fuel, Gauge, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ModelSummary } from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';

import { buttonStyles } from '../ui/button-styles';

interface VehicleCardProps {
  model: ModelSummary;
}

export function VehicleCard({ model }: VehicleCardProps) {
  const imageUrl = model.primaryImage?.url ?? `/images/vehicles/${model.slug}-exterior.svg`;

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden border border-ink-950/10 bg-ivory-50 transition-all duration-300 hover:border-brass-400 hover:shadow-[0_20px_50px_-20px_rgba(7,10,9,0.15)]">
      {/* Top Image & Badge */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-sand-200/40">
        <img
          src={imageUrl}
          alt={model.primaryImage?.altText ?? `${model.make} ${model.name} illustration`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-3 py-1 text-[0.55rem] font-semibold tracking-[0.2em] text-ivory-50 uppercase backdrop-blur-md">
            {model.bodyType}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-ivory-50/20 bg-ink-950/60 px-2.5 py-1 text-[0.52rem] font-medium tracking-[0.15em] text-ivory-50/80 uppercase backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-brass-300" aria-hidden="true" />
            Illustrative Artwork
          </span>
        </div>
      </div>

      {/* Body content */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[0.6rem] font-semibold tracking-[0.22em] text-stone-500 uppercase">
              {model.make}
            </p>
            <span className="text-[0.6rem] font-medium tracking-[0.16em] text-stone-500 uppercase">
              {model.variantCount} {model.variantCount === 1 ? 'Variant' : 'Variants'}
            </span>
          </div>

          <h3 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">{model.name}</h3>

          <p className="mt-3 line-clamp-2 text-xs leading-6 text-stone-600 sm:text-sm sm:leading-6">
            {model.summary}
          </p>

          {/* Powertrain badges */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-ink-950/10 pt-4 text-[0.65rem] text-stone-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Fuel className="h-3.5 w-3.5 text-brass-500" aria-hidden="true" />
              <span>{model.fuelTypes.join(' · ')}</span>
            </div>
            <span className="text-ink-950/20">•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Gauge className="h-3.5 w-3.5 text-brass-500" aria-hidden="true" />
              <span>{model.transmissions.join(' · ')}</span>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-8 flex items-center justify-between border-t border-ink-950/10 pt-5">
          <div>
            <span className="block text-[0.55rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
              Ex-showroom from
            </span>
            <p className="font-display text-xl text-ink-950 sm:text-2xl">
              {model.startingPricePaise
                ? formatInrFromPaise(model.startingPricePaise)
                : 'On request'}
            </p>
          </div>

          <Link
            to={`/vehicles/${model.slug}`}
            className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
            aria-label={`View ${model.make} ${model.name} variants and pricing`}
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
