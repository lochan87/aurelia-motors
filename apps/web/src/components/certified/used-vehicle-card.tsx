import {
  ArrowRight,
  CheckCircle,
  FileCheck,
  Fuel,
  Gauge,
  MapPin,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { UsedVehicleSummary } from '@aurelia/shared';
import { formatInr, formatInrFromPaise } from '@aurelia/shared';

import { buttonStyles } from '../ui/button-styles';

interface UsedVehicleCardProps {
  vehicle: UsedVehicleSummary;
}

export function UsedVehicleCard({ vehicle }: UsedVehicleCardProps) {
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden border border-ink-950/10 bg-ivory-50 transition-all duration-300 hover:border-brass-400 hover:shadow-[0_20px_50px_-20px_rgba(7,10,9,0.15)]">
      {/* Visual illustration & Badges */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-sand-200/40">
        <img
          src={vehicle.thumbnailPlaceholderUrl}
          alt={`${vehicle.make} ${vehicle.modelName} certified pre-owned illustration`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {vehicle.certified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brass-500 px-2.5 py-1 text-[0.55rem] font-semibold tracking-[0.16em] text-ivory-50 uppercase shadow-sm">
              <CheckCircle className="h-3 w-3" />
              Certified
            </span>
          )}

          {vehicle.overallScore !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2.5 py-1 text-[0.55rem] font-semibold tracking-[0.16em] text-ivory-50 uppercase backdrop-blur-md">
              <FileCheck className="h-3 w-3 text-brass-300" />
              Score: {vehicle.overallScore}/100
            </span>
          )}
        </div>

        <div className="absolute right-4 bottom-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-ivory-50/20 bg-ink-950/60 px-2 py-0.5 text-[0.5rem] font-medium tracking-wider text-ivory-50/80 uppercase backdrop-blur-md">
            <Sparkles className="h-2.5 w-2.5 text-brass-300" />
            Artwork Placeholder
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
        <div>
          {/* Masked plate & location */}
          <div className="flex items-center justify-between gap-2 border-b border-ink-950/10 pb-3">
            <span className="inline-block rounded border border-ink-950/20 bg-ivory-100 px-2 py-0.5 font-mono text-[0.65rem] font-bold tracking-wider text-ink-950">
              {vehicle.registrationNumberMasked}
            </span>

            <span className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-stone-600">
              <MapPin className="h-3 w-3 text-brass-500" />
              {vehicle.showroom.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-3 font-display text-xl text-ink-950 sm:text-2xl">
            {vehicle.registrationYear} {vehicle.make} {vehicle.modelName}
          </h3>
          <p className="text-xs font-medium text-stone-600">{vehicle.variantName}</p>

          {/* Key Attributes */}
          <div className="mt-5 grid grid-cols-2 gap-y-2 text-[0.68rem] text-stone-700">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-brass-500" />
              <span>{formatInr(vehicle.mileageKm).replace('₹', '')} km</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-brass-500" />
              <span>
                {vehicle.fuelType} · {vehicle.transmission}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-brass-500" />
              <span>
                {vehicle.ownershipCount === 1 ? '1st Owner' : `${vehicle.ownershipCount}nd Owner`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brass-500" />
              <span>{vehicle.colourName}</span>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-6 flex items-center justify-between border-t border-ink-950/10 pt-4">
          <div>
            <span className="block text-[0.52rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
              Certified Price
            </span>
            <p className="font-display text-xl text-ink-950 sm:text-2xl">
              {formatInrFromPaise(vehicle.pricePaise)}
            </p>
          </div>

          <Link
            to={`/certified/${vehicle.slug}`}
            className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
            aria-label={`Inspect ${vehicle.registrationYear} ${vehicle.make} ${vehicle.modelName} report`}
          >
            Inspect
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
