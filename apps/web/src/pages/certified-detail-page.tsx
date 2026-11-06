import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Fuel,
  Gauge,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { formatInr, formatInrFromPaise } from '@aurelia/shared';

import { InspectionReportView } from '../components/certified/inspection-report-view';
import { EnquiryModal } from '../components/enquiry/enquiry-modal';
import { Container } from '../components/ui/container';
import { buttonStyles } from '../components/ui/button-styles';
import { api } from '../lib/api-client';

export function CertifiedDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: vehicle,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['used-vehicle', slug],
    queryFn: () => api.getUsedVehicle(slug ?? ''),
    enabled: Boolean(slug),
  });

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-ivory-50 py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="text-xs tracking-widest text-stone-600 uppercase">
            Loading vehicle inspection file...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="bg-ivory-50 py-24">
        <Container>
          <div className="border border-red-200 bg-red-50/50 p-8 text-center text-ink-950 sm:p-12">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="mt-4 font-display text-2xl">Certified Vehicle Not Found</h2>
            <p className="mt-2 text-xs text-stone-600 sm:text-sm">
              {(error as Error)?.message ||
                `The requested vehicle listing '${slug}' was not found in our certified inventory.`}
            </p>
            <div className="mt-6">
              <Link to="/certified" className={buttonStyles({ variant: 'outline-dark' })}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to certified inventory
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
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/certified"
            className="group inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.2em] text-stone-600 uppercase transition-colors hover:text-brass-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Back to certified listings
          </Link>
        </div>

        {/* Top Header Grid */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-block rounded border border-ink-950/20 bg-ivory-100 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-ink-950">
                {vehicle.registrationNumberMasked}
              </span>
              <span className="text-[0.62rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                {vehicle.registrationYear} Registration
              </span>
              <span className="h-px w-5 bg-brass-500/50" />
              <span className="inline-flex items-center gap-1 text-[0.62rem] font-medium text-stone-600">
                <MapPin className="h-3 w-3 text-brass-500" />
                {vehicle.showroom.name}
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl text-ink-950 sm:text-4xl lg:text-5xl">
              {vehicle.registrationYear} {vehicle.make} {vehicle.modelName}
            </h1>
            <p className="mt-2 text-base font-medium text-stone-600 sm:text-lg">
              {vehicle.variantName}
            </p>

            <p className="mt-4 text-xs leading-6 text-stone-600 sm:text-sm sm:leading-6">
              {vehicle.description}
            </p>

            {/* Highlights */}
            {vehicle.highlights.length > 0 && (
              <div className="mt-6 border-t border-ink-950/10 pt-5">
                <span className="text-[0.58rem] font-semibold tracking-[0.22em] text-stone-500 uppercase">
                  Vehicle Highlights
                </span>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {vehicle.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-xs text-ink-900">
                      <Check className="h-3.5 w-3.5 text-brass-500" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pricing & Summary Card */}
          <div className="flex flex-col justify-between border border-ink-950/10 bg-ivory-100/60 p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-ink-950/10 pb-4">
                <div>
                  <span className="text-[0.55rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                    Asking Price (Certified)
                  </span>
                  <p className="font-display text-3xl text-ink-950 sm:text-4xl">
                    {formatInrFromPaise(vehicle.pricePaise)}
                  </p>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1 text-center text-[0.6rem] font-bold tracking-wider text-emerald-800 uppercase">
                  {vehicle.stockStatus}
                </div>
              </div>

              {/* Specification Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Odometer
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-ink-950">
                    <Gauge className="h-3 w-3 text-brass-500" />
                    {formatInr(vehicle.mileageKm).replace('₹', '')} km
                  </span>
                </div>

                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Fuel
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-ink-950">
                    <Fuel className="h-3 w-3 text-brass-500" />
                    {vehicle.fuelType}
                  </span>
                </div>

                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Gearbox
                  </span>
                  <span className="mt-1 font-semibold text-ink-950">{vehicle.transmission}</span>
                </div>

                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Ownership
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-ink-950">
                    <UserCheck className="h-3 w-3 text-brass-500" />
                    {vehicle.ownershipCount === 1
                      ? '1st Owner'
                      : `${vehicle.ownershipCount}nd Owner`}
                  </span>
                </div>

                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Colour
                  </span>
                  <span className="mt-1 font-semibold text-ink-950">{vehicle.colourName}</span>
                </div>

                <div className="border border-ink-950/10 bg-ivory-50 p-3">
                  <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
                    Inspection
                  </span>
                  <span className="mt-1 font-semibold text-emerald-700">
                    {vehicle.overallScore ? `${vehicle.overallScore}/100 Score` : 'Passed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Notice & CTA */}
            <div className="mt-8 space-y-4 border-t border-ink-950/10 pt-5">
              <div className="flex items-center gap-2 text-xs text-stone-700">
                <MapPin className="h-4 w-4 text-brass-500" />
                <span>
                  Parked for physical inspection at <strong>{vehicle.showroom.name}</strong>,
                  Lucknow.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={buttonStyles({ variant: 'primary', size: 'md', className: 'w-full' })}
              >
                <MessageSquare className="h-4 w-4" />
                Enquire About This Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Illustration */}
        <div className="mt-12">
          <div className="relative aspect-21/9 w-full overflow-hidden border border-ink-950/10 bg-sand-200/50">
            <img
              src={vehicle.thumbnailPlaceholderUrl}
              alt={`${vehicle.make} ${vehicle.modelName} profile illustration`}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-ivory-50/20 bg-ink-950/80 px-3 py-1 text-[0.55rem] font-medium tracking-[0.16em] text-ivory-50 uppercase backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-brass-300" />
              Illustrative Artwork · Original Car Photos Verified In-Person
            </div>
          </div>
        </div>

        {/* Published Inspection Report */}
        {vehicle.inspection && (
          <div className="mt-16">
            <InspectionReportView report={vehicle.inspection} />
          </div>
        )}

        {/* Return / Callout banner */}
        <div className="mt-16 border border-ink-950/10 bg-ink-950 p-8 text-ivory-50 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="text-[0.62rem] font-semibold tracking-[0.24em] text-brass-300 uppercase">
                Aurelia Pre-Owned Guarantee
              </span>
              <h3 className="mt-2 font-display text-2xl text-ivory-50 sm:text-3xl">
                Inspect in person at {vehicle.showroom.name}
              </h3>
              <p className="mt-2 max-w-xl text-xs leading-6 text-ivory-50/70 sm:text-sm">
                Every certified vehicle includes a 12-month mechanical warranty, clean title
                guarantee, and a transparent line-by-line transfer and registration breakdown.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                <MessageSquare className="h-4 w-4" />
                Enquire Online
              </button>
              <Link to="/#visit" className={buttonStyles({ variant: 'outline-light', size: 'md' })}>
                View Showroom Hours
              </Link>
              <Link
                to="/certified"
                className={buttonStyles({ variant: 'outline-light', size: 'md' })}
              >
                All Certified Vehicles
              </Link>
            </div>
          </div>
        </div>

        {/* Enquiry Modal */}
        <EnquiryModal
          isOpen={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          preselectedUsedVehicleId={vehicle.id}
          defaultShowroomId={vehicle.showroom.id}
          vehicleTitle={`${vehicle.registrationYear} ${vehicle.make} ${vehicle.modelName} (${vehicle.registrationNumberMasked})`}
        />
      </Container>
    </div>
  );
}
