import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { CreateTestDriveBookingInput, TestDriveBookingConfirmation } from '@aurelia/shared';
import { buttonStyles } from '../components/ui/button-styles';
import { Container } from '../components/ui/container';
import { TextField, TextareaField } from '../components/ui/form-controls';
import { SectionHeader } from '../components/ui/section-header';
import { api, ApiError } from '../lib/api-client';

export function TestDrivePage() {
  const [searchParams] = useSearchParams();
  const preselectedModelSlug = searchParams.get('model');
  const preselectedShowroomCode = searchParams.get('showroom');

  // Fetch models
  const { data: models = [], isLoading: isModelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.getModels(),
  });

  // Fetch showrooms
  const { data: showrooms = [], isLoading: isShowroomsLoading } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  const [selectedModelSlug, setSelectedModelSlug] = useState<string>(preselectedModelSlug || '');
  const activeModelSlug = selectedModelSlug || (models[0]?.slug ?? '');

  // Fetch full model details for variants
  const { data: modelDetail, isLoading: isModelDetailLoading } = useQuery({
    queryKey: ['catalogue-model', activeModelSlug],
    queryFn: () => api.getModel(activeModelSlug),
    enabled: Boolean(activeModelSlug),
  });

  const [selectedShowroomId, setSelectedShowroomId] = useState<string>('');
  const activeShowroomId =
    selectedShowroomId ||
    showrooms.find((s) => s.code === preselectedShowroomCode)?.id ||
    showrooms[0]?.id ||
    '';

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const activeVariantId = selectedVariantId || (modelDetail?.variants[0]?.id ?? '');

  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0] ?? '';

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [selectedSlotStartTime, setSelectedSlotStartTime] = useState<string>('');

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<TestDriveBookingConfirmation | null>(null);

  // Availability query
  const {
    data: availability,
    isLoading: isAvailabilityLoading,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ['test-drive-availability', activeShowroomId, activeVariantId, selectedDate],
    queryFn: () =>
      api.getTestDriveAvailability({
        showroomId: activeShowroomId,
        variantId: activeVariantId,
        date: selectedDate,
      }),
    enabled: Boolean(activeShowroomId && activeVariantId && selectedDate),
  });

  const activeShowroom = showrooms.find((s) => s.id === activeShowroomId);
  const activeVariant = modelDetail?.variants.find((v) => v.id === activeVariantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSlotStartTime) {
      setErrorMessage('Please select an available test-drive time slot.');
      return;
    }

    if (!consentGranted) {
      setErrorMessage('Please accept the DPDP consent notice to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateTestDriveBookingInput = {
        showroomId: activeShowroomId,
        variantId: activeVariantId,
        startTime: selectedSlotStartTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        driverLicenseNumber: licenseNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        consentGranted: true,
        idempotencyKey: `td-page-${crypto.randomUUID()}`,
      };

      const result = await api.bookTestDrive(payload);
      setConfirmation(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') {
        setErrorMessage(
          'This test drive slot was just booked by another customer. Please select another slot.',
        );
        refetchAvailability();
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred while booking your test drive.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isModelsLoading || isShowroomsLoading || isModelDetailLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-ivory-50 py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="text-xs tracking-widest text-stone-600 uppercase">
            Loading demo fleet and showroom schedules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory-50 py-12 sm:py-20">
      <Container className="max-w-4xl">
        <SectionHeader
          index="03"
          eyebrow="Test Drive"
          title={
            <>
              Book a Confirmed <em className="text-brass-500 italic">Test Drive</em>
            </>
          }
          description="Experience Vantara passenger vehicles on Lucknow roads. Every test drive is backed by real-time demo vehicle assignment across our three showrooms."
        />

        {confirmation ? (
          <div className="mt-12 border border-ink-950/10 bg-ivory-100 p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
              <h2 className="font-display text-3xl text-ink-950">Test Drive Confirmed</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-stone-700">
              Your test drive for the <strong>{confirmation.vehicle.modelName}</strong> (
              {confirmation.vehicle.variantName}) has been confirmed at our{' '}
              <strong>{confirmation.showroom.name}</strong> showroom.
            </p>

            <div className="mt-6 space-y-3 border border-ink-950/10 bg-white p-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Booking Reference</span>
                <span className="rounded bg-sand-200/60 px-2.5 py-1 font-mono font-bold tracking-wider text-ink-950">
                  {confirmation.bookingReference}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Showroom</span>
                <span className="font-medium text-ink-950">{confirmation.showroom.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Scheduled Time</span>
                <span className="font-medium text-ink-950">
                  {new Date(confirmation.startTime).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Demo Registration</span>
                <span className="font-medium text-ink-950">
                  {confirmation.vehicle.demoRegistration}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Customer</span>
                <span className="font-medium text-ink-950">{confirmation.customer.fullName}</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-stone-500">
              Please carry a valid driving license. An advisor will have the air conditioning
              running and the vehicle prepped for your arrival.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={`/bookings/confirmation/${confirmation.bookingReference}?token=${confirmation.confirmationToken}`}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Booking Confirmation
              </Link>
              <Link
                to="/vehicles"
                className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
              >
                Back to Vehicle Catalogue
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-10">
            {errorMessage && (
              <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Model & Variant */}
            <div className="space-y-4 border border-ink-950/10 bg-ivory-100 p-6">
              <h3 className="font-display text-lg text-ink-950">1. Choose Vehicle & Variant</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Vehicle Model *
                  </label>
                  <select
                    value={activeModelSlug}
                    onChange={(e) => {
                      setSelectedModelSlug(e.target.value);
                      setSelectedVariantId('');
                      setSelectedSlotStartTime('');
                    }}
                    className="mt-1.5 w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                  >
                    {models.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.make} {m.name} ({m.bodyType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Variant *
                  </label>
                  <select
                    value={activeVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      setSelectedSlotStartTime('');
                    }}
                    className="mt-1.5 w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                  >
                    {modelDetail?.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.fuelType} · {v.transmission})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Showroom & Date */}
            <div className="space-y-4 border border-ink-950/10 bg-ivory-100 p-6">
              <h3 className="font-display text-lg text-ink-950">2. Select Showroom & Date</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Lucknow Showroom *
                  </label>
                  <select
                    value={activeShowroomId}
                    onChange={(e) => {
                      setSelectedShowroomId(e.target.value);
                      setSelectedSlotStartTime('');
                    }}
                    className="mt-1.5 w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                  >
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Preferred Date *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlotStartTime('');
                      }}
                      className="w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                      required
                    />
                    <Calendar className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-stone-500" />
                  </div>
                </div>
              </div>

              {/* Slots */}
              <div className="border-t border-ink-950/10 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Available Time Slots (45m drive) *
                  </label>
                  {isAvailabilityLoading && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] text-stone-500">
                      <Loader2 className="h-3 w-3 animate-spin text-brass-500" />
                      Checking demo vehicle availability...
                    </span>
                  )}
                </div>

                {availability && !availability.hasDemoVehicle && (
                  <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    No demo car is configured for {activeVariant?.name} at {activeShowroom?.name}.
                    Please select another showroom above.
                  </div>
                )}

                {availability?.hasDemoVehicle && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {availability.slots.map((slot) => {
                      const isSelected = selectedSlotStartTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlotStartTime(slot.startTime)}
                          className={`flex flex-col items-center justify-center rounded border p-2.5 text-center transition-all ${
                            !slot.isAvailable
                              ? 'cursor-not-allowed border-stone-200 bg-stone-100 opacity-40'
                              : isSelected
                                ? 'border-brass-500 bg-sand-200/90 font-bold text-ink-950 ring-2 ring-brass-500/20'
                                : 'border-ink-950/10 bg-white text-stone-800 hover:border-brass-400'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-xs font-medium">
                            <Clock className="h-3 w-3 text-brass-500" />
                            {slot.displayTime.replace(' IST', '')}
                          </span>
                          <span className="mt-1 text-[0.6rem] text-stone-500">
                            {slot.isAvailable
                              ? `${slot.availableVehiclesCount} car${slot.availableVehiclesCount > 1 ? 's' : ''} free`
                              : 'Fully booked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Contact Details */}
            <div className="space-y-4 border border-ink-950/10 bg-ivory-100 p-6">
              <h3 className="font-display text-lg text-ink-950">3. Contact & Driving License</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Full Name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Mishra"
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Email Address"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <TextField
                  label="Driving License Number (Optional)"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. UP32 2021 0012345"
                />
              </div>

              <TextareaField
                label="Driving Preferences / Questions"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. City traffic and boot capacity review"
              />

              <div className="flex items-start gap-3 border border-ink-950/10 bg-sand-200/40 p-4">
                <input
                  type="checkbox"
                  id="td-page-consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-950/20 text-brass-500 focus:ring-brass-500"
                  required
                />
                <label htmlFor="td-page-consent" className="text-xs leading-5 text-stone-700">
                  I consent to Aurelia Motors processing my contact details for test-drive
                  scheduling in compliance with the Digital Personal Data Protection (DPDP) Act.
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-ink-950/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <ShieldCheck className="h-4 w-4 text-brass-500" />
                <span>Instant confirmation backed by confirmed demo vehicle fleet.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedSlotStartTime || !consentGranted}
                className={buttonStyles({ variant: 'primary', size: 'lg' })}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Locking Demo Fleet...
                  </>
                ) : (
                  'Confirm Test Drive'
                )}
              </button>
            </div>
          </form>
        )}
      </Container>
    </div>
  );
}
