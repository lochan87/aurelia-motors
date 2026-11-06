import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Calendar, Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { TestDriveModal } from '../components/bookings/test-drive-modal';
import { ColourSelector } from '../components/vehicles/colour-selector';
import { OnRoadPriceCalculator } from '../components/vehicles/on-road-price-calculator';
import { ShowroomAvailability } from '../components/vehicles/showroom-availability';
import { SpecificationsTable } from '../components/vehicles/specifications-table';
import { VariantSelector } from '../components/vehicles/variant-selector';
import { VehicleGallery } from '../components/vehicles/vehicle-gallery';
import { Container } from '../components/ui/container';
import { buttonStyles } from '../components/ui/button-styles';
import { api } from '../lib/api-client';

export function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: model,
    isLoading: isModelLoading,
    isError: isModelError,
    error: modelError,
  } = useQuery({
    queryKey: ['catalogue-model', slug],
    queryFn: () => api.getModel(slug ?? ''),
    enabled: Boolean(slug),
  });

  const { data: showrooms = [] } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  const [selectedVariantSlug, setSelectedVariantSlug] = useState<string>('');
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);

  // Fallback to first variant if none selected or if model loaded
  const currentVariantSlug = selectedVariantSlug || (model?.variants[0]?.slug ?? '');

  const activeVariant =
    model?.variants.find((v) => v.slug === currentVariantSlug) ?? model?.variants[0];

  if (isModelLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-ivory-50 py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="text-xs tracking-widest text-stone-600 uppercase">
            Loading vehicle details...
          </p>
        </div>
      </div>
    );
  }

  if (isModelError || !model) {
    return (
      <div className="bg-ivory-50 py-24">
        <Container>
          <div className="border border-red-200 bg-red-50/50 p-8 text-center text-ink-950 sm:p-12">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="mt-4 font-display text-2xl">Vehicle Model Not Found</h2>
            <p className="mt-2 text-xs text-stone-600 sm:text-sm">
              {(modelError as Error)?.message ||
                `The requested vehicle model '${slug}' could not be located in our catalogue.`}
            </p>
            <div className="mt-6">
              <Link to="/vehicles" className={buttonStyles({ variant: 'outline-dark' })}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to vehicle catalogue
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-ivory-50 py-12 sm:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/vehicles"
            className="group inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.2em] text-stone-600 uppercase transition-colors hover:text-brass-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Back to catalogue
          </Link>
        </div>

        {/* Model Title & Intro */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[0.62rem] font-semibold tracking-[0.26em] text-stone-500 uppercase">
                {model.make} · Lucknow
              </span>
              <span className="h-px w-6 bg-brass-500/50" />
              <span className="rounded-full bg-sand-200/60 px-2.5 py-0.5 text-[0.55rem] font-semibold tracking-[0.18em] text-ink-900 uppercase">
                {model.bodyType}
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl text-ink-950 sm:text-5xl lg:text-6xl">
              {model.name}
            </h1>

            <p className="mt-4 text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
              {model.summary}
            </p>

            <p className="mt-4 text-xs leading-6 text-stone-600 sm:text-sm sm:leading-6">
              {model.description}
            </p>
          </div>

          <div className="flex flex-col justify-end border-l-2 border-brass-400 pl-6 lg:border-l-2 lg:pl-8">
            <span className="text-[0.58rem] font-semibold tracking-[0.22em] text-stone-500 uppercase">
              लखनऊ शोरूम अनुभव
            </span>
            <p className="mt-1 font-display text-2xl text-ink-950 sm:text-3xl">
              Central Lucknow · Gomti Nagar · Sushant Golf City
            </p>
            <p className="mt-2 text-xs text-stone-600">
              Personal walkthroughs and bespoke on-road consultations available across all three
              locations.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsTestDriveOpen(true)}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                <Calendar className="h-3.5 w-3.5" />
                Book a Test Drive
              </button>
            </div>
          </div>
        </div>

        {/* Gallery & Selectors Section */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <VehicleGallery images={model.images} modelName={model.name} />

          <div className="flex flex-col gap-8">
            <VariantSelector
              variants={model.variants}
              selectedVariantSlug={currentVariantSlug}
              onSelectVariant={setSelectedVariantSlug}
            />

            <ColourSelector colours={model.colours} />
          </div>
        </div>

        {/* Showroom Availability Matrix */}
        {activeVariant && (
          <div className="mt-16">
            <ShowroomAvailability inventory={activeVariant.inventory} />
          </div>
        )}

        {/* Transparent On-Road Price Calculator */}
        {activeVariant && (
          <div className="mt-16">
            <OnRoadPriceCalculator variantSlug={activeVariant.slug} showrooms={showrooms} />
          </div>
        )}

        {/* Technical Specifications */}
        {activeVariant && activeVariant.specifications.length > 0 && (
          <div className="mt-16">
            <SpecificationsTable specifications={activeVariant.specifications} />
          </div>
        )}

        {/* Dealership Action Callout */}
        <div className="mt-16 border border-ink-950/10 bg-ivory-100 p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="text-[0.62rem] font-semibold tracking-[0.24em] text-brass-500 uppercase">
                Visit Aurelia Motors
              </span>
              <h3 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
                Ready to experience the {model.name}?
              </h3>
              <p className="mt-2 max-w-xl text-xs leading-6 text-stone-600 sm:text-sm">
                Book a dedicated 45-minute test drive with a real-time confirmed demo vehicle across
                Central Lucknow, Gomti Nagar, or Sushant Golf City.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsTestDriveOpen(true)}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                <Calendar className="h-3.5 w-3.5" />
                Book a Test Drive
              </button>
              <Link to="/#visit" className={buttonStyles({ variant: 'outline-dark', size: 'md' })}>
                <MapPin className="h-3.5 w-3.5" />
                Showrooms
              </Link>
              <Link
                to="/certified"
                className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
              >
                Explore Certified Cars
              </Link>
            </div>
          </div>
        </div>

        {/* Test Drive Booking Modal */}
        <TestDriveModal
          isOpen={isTestDriveOpen}
          onClose={() => setIsTestDriveOpen(false)}
          model={model}
          initialVariantId={activeVariant?.id}
        />
      </Container>
    </div>
  );
}
