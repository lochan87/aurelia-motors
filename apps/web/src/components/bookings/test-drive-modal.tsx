import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, CheckCircle2, Clock, ExternalLink, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  CreateTestDriveBookingInput,
  ModelDetail,
  TestDriveBookingConfirmation,
} from '@aurelia/shared';
import { api, ApiError } from '../../lib/api-client';
import { buttonStyles } from '../ui/button-styles';
import { TextField, TextareaField } from '../ui/form-controls';

interface TestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelDetail;
  initialVariantId?: string;
  initialShowroomId?: string;
}

export function TestDriveModal({
  isOpen,
  onClose,
  model,
  initialVariantId,
  initialShowroomId,
}: TestDriveModalProps) {
  const { data: showrooms = [] } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
    enabled: isOpen,
  });

  const [selectedShowroomId, setSelectedShowroomId] = useState<string>(
    initialShowroomId || (showrooms[0]?.id ?? ''),
  );

  const activeShowroomId = selectedShowroomId || (showrooms[0]?.id ?? '');

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || (model.variants[0]?.id ?? ''),
  );

  const activeVariantId = selectedVariantId || (model.variants[0]?.id ?? '');

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

  // Query availability when showroom, variant, and date are selected
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
    enabled: isOpen && Boolean(activeShowroomId && activeVariantId && selectedDate),
  });

  if (!isOpen) return null;

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
        idempotencyKey: `td-web-${crypto.randomUUID()}`,
      };

      const result = await api.bookTestDrive(payload);
      setConfirmation(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') {
        setErrorMessage(
          'This slot was just claimed by another customer. Please select another slot.',
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

  const handleResetAndClose = () => {
    setConfirmation(null);
    setErrorMessage(null);
    onClose();
  };

  const activeShowroom = showrooms.find((s) => s.id === activeShowroomId);
  const activeVariant = model.variants.find((v) => v.id === activeVariantId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-drive-title"
    >
      <div className="relative w-full max-w-2xl border border-ivory-50/20 bg-ivory-50 text-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-950/10 bg-ivory-100 px-6 py-4">
          <div>
            <span className="text-[0.62rem] font-semibold tracking-[0.24em] text-brass-500 uppercase">
              Aurelia Motors Experience
            </span>
            <h2 id="test-drive-title" className="font-display text-2xl text-ink-950">
              Schedule a Test Drive
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-200/50 hover:text-ink-950"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {confirmation ? (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
              <h3 className="font-display text-2xl text-ink-950">Test Drive Confirmed</h3>
            </div>

            <p className="mt-3 text-xs leading-6 text-stone-600 sm:text-sm">
              Your test drive for the <strong>{confirmation.vehicle.modelName}</strong> (
              {confirmation.vehicle.variantName}) has been confirmed at our{' '}
              <strong>{confirmation.showroom.name}</strong> showroom.
            </p>

            <div className="mt-6 space-y-3 border border-ink-950/10 bg-ivory-100 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Booking Reference</span>
                <span className="rounded bg-sand-200/60 px-2 py-0.5 font-mono font-bold tracking-wider text-ink-950">
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
                <span className="text-stone-500">Demo Vehicle</span>
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
              Please carry a valid permanent driving license. A dedicated customer relationship
              advisor has been assigned to prepare your vehicle.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                to={`/bookings/confirmation/${confirmation.bookingReference}?token=${confirmation.confirmationToken}`}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
                onClick={handleResetAndClose}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Confirmation Page
              </Link>
              <button
                type="button"
                onClick={handleResetAndClose}
                className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] space-y-6 overflow-y-auto p-6 sm:p-8"
          >
            {errorMessage && (
              <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Showroom & Variant Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                  Select Showroom *
                </label>
                <select
                  value={activeShowroomId}
                  onChange={(e) => {
                    setSelectedShowroomId(e.target.value);
                    setSelectedSlotStartTime('');
                  }}
                  className="mt-1.5 w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                >
                  {showrooms.map((showroom) => (
                    <option key={showroom.id} value={showroom.id}>
                      {showroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                  Select Variant *
                </label>
                <select
                  value={activeVariantId}
                  onChange={(e) => {
                    setSelectedVariantId(e.target.value);
                    setSelectedSlotStartTime('');
                  }}
                  className="mt-1.5 w-full rounded-sm border border-ink-950/15 bg-white px-3 py-2.5 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
                >
                  {model.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.fuelType} · {v.transmission})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                Appointment Date *
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

            {/* Time Slot Selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                  Available Time Slots (45 Min Drive) *
                </label>
                {isAvailabilityLoading && (
                  <span className="flex items-center gap-1.5 text-[0.65rem] text-stone-500">
                    <Loader2 className="h-3 w-3 animate-spin text-brass-500" />
                    Checking demo fleet...
                  </span>
                )}
              </div>

              {availability && !availability.hasDemoVehicle && (
                <div className="mt-2 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  No demo vehicle is currently stationed for {activeVariant?.name} at{' '}
                  {activeShowroom?.name}. Please switch to another Lucknow showroom above.
                </div>
              )}

              {availability?.hasDemoVehicle && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                              ? 'border-brass-500 bg-sand-200/80 font-bold text-ink-950 ring-2 ring-brass-500/20'
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

            {/* Customer Details Form */}
            <div className="space-y-4 border-t border-ink-950/10 pt-5">
              <h4 className="text-xs font-semibold tracking-wider text-ink-900 uppercase">
                Customer & License Information
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Full Name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
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
                label="Special Requests or Route Preferences"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Interested in highway performance and boot space comparison"
              />

              {/* DPDP Consent */}
              <div className="bg-sand-100/50 flex items-start gap-3 border border-ink-950/10 p-3.5">
                <input
                  type="checkbox"
                  id="dpdp-consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-950/20 text-brass-500 focus:ring-brass-500"
                  required
                />
                <label htmlFor="dpdp-consent" className="text-[0.72rem] leading-5 text-stone-600">
                  I consent to Aurelia Motors collecting and processing my contact details for
                  test-drive scheduling and showroom verification pursuant to India's Digital
                  Personal Data Protection (DPDP) Act.
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleResetAndClose}
                className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedSlotStartTime || !consentGranted}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Locking Demo Vehicle...
                  </>
                ) : (
                  'Confirm Test Drive'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
