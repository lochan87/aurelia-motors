import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Download,
  KeyRound,
  Loader2,
  MapPin,
  Phone,
  Shield,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { buttonStyles } from '../components/ui/button-styles';
import { Container } from '../components/ui/container';
import { TextField } from '../components/ui/form-controls';
import { api } from '../lib/api-client';

export function BookingConfirmationPage() {
  const { reference } = useParams<{ reference: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [enteredToken, setEnteredToken] = useState(tokenFromUrl);
  const activeToken = tokenFromUrl || enteredToken;

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['booking-confirmation', reference, activeToken],
    queryFn: () => api.getBookingConfirmation(reference ?? '', activeToken || undefined),
    enabled: Boolean(reference),
  });

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredToken) {
      setSearchParams({ token: enteredToken });
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelError(null);

    if (!activeToken) {
      setCancelError('Confirmation token is required to cancel this appointment.');
      return;
    }

    setIsCancelling(true);

    try {
      await api.cancelBooking(reference ?? '', {
        confirmationToken: activeToken,
        reason: cancelReason || 'Cancelled by customer',
      });
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : 'Failed to cancel appointment. Please verify token.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const downloadCalendarFile = () => {
    if (!booking) return;

    const start = new Date(booking.startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(booking.endTime).toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aurelia Motors//Dealership Appointments//EN',
      'BEGIN:VEVENT',
      `UID:${booking.bookingReference}@aureliamotors.com`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Aurelia Motors: ${booking.title}`,
      `DESCRIPTION:${booking.subtitle} - Ref: ${booking.bookingReference}`,
      `LOCATION:${booking.location.name}, ${booking.location.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aurelia-${booking.bookingReference}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-ivory-50 py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="text-xs tracking-widest text-stone-600 uppercase">
            Retrieving appointment details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="bg-ivory-50 py-24">
        <Container>
          <div className="border border-red-200 bg-red-50/50 p-8 text-center text-ink-950 sm:p-12">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <h2 className="mt-4 font-display text-2xl">Appointment Not Found</h2>
            <p className="mt-2 text-xs text-stone-600 sm:text-sm">
              {(error as Error)?.message ||
                `No appointment could be found for reference '${reference}'. Please check your booking code.`}
            </p>
            <div className="mt-6">
              <Link to="/" className={buttonStyles({ variant: 'outline-dark' })}>
                Return to home
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="bg-ivory-50 py-12 sm:py-20">
      <Container className="max-w-3xl">
        {/* Status Card */}
        <div className="border border-ink-950/10 bg-ivory-100 p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-4 border-b border-ink-950/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.62rem] font-semibold tracking-wider text-stone-500 uppercase">
                  {booking.bookingType === 'TEST_DRIVE' ? 'Test Drive Booking' : 'Workshop Service'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wider uppercase ${
                    isCancelled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
                {booking.title}
              </h1>
              <p className="mt-1 text-xs text-stone-600">{booking.subtitle}</p>
            </div>

            <div className="text-right sm:border-l sm:border-ink-950/10 sm:pl-6">
              <span className="block text-[0.62rem] tracking-wider text-stone-500 uppercase">
                Booking Reference
              </span>
              <span className="font-mono text-xl font-bold tracking-wider text-ink-950">
                {booking.bookingReference}
              </span>
            </div>
          </div>

          {/* Cancellation Notice if cancelled */}
          {isCancelled && (
            <div className="mt-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold">This booking has been cancelled.</p>
                <p className="mt-0.5 text-stone-600">
                  The assigned slot and capacity have been released back to the dealership pool.
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {/* Time & Date */}
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-ink-950">
                <Calendar className="h-4 w-4 text-brass-500" />
              </span>
              <div>
                <span className="block text-[0.65rem] tracking-wider text-stone-500 uppercase">
                  Date & Time (IST)
                </span>
                <span className="text-sm font-semibold text-ink-950">
                  {new Date(booking.startTime).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="mt-0.5 block text-xs text-stone-600">
                  {new Date(booking.startTime).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}{' '}
                  –{' '}
                  {new Date(booking.endTime).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-200 text-ink-950">
                <MapPin className="h-4 w-4 text-brass-500" />
              </span>
              <div>
                <span className="block text-[0.65rem] tracking-wider text-stone-500 uppercase">
                  Location
                </span>
                <span className="text-sm font-semibold text-ink-950">{booking.location.name}</span>
                <span className="mt-0.5 block text-xs text-stone-600">
                  {booking.location.address}
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs text-brass-500">
                  <Phone className="h-3 w-3" />
                  {booking.location.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Privacy Section */}
          <div className="mt-8 border-t border-ink-950/10 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-ink-900 uppercase">
                Customer Details
              </span>
              {booking.isMasked && (
                <span className="flex items-center gap-1 text-[0.65rem] text-stone-500">
                  <Shield className="h-3 w-3 text-brass-500" />
                  DPDP Masked View
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 border border-ink-950/10 bg-white p-4 text-xs sm:grid-cols-3">
              <div>
                <span className="block text-[0.65rem] text-stone-400">Full Name</span>
                <span className="font-medium text-ink-950">{booking.customer.fullName}</span>
              </div>
              <div>
                <span className="block text-[0.65rem] text-stone-400">Phone</span>
                <span className="font-medium text-ink-950">{booking.customer.phone}</span>
              </div>
              <div>
                <span className="block text-[0.65rem] text-stone-400">Email</span>
                <span className="font-medium text-ink-950">{booking.customer.email}</span>
              </div>
            </div>

            {booking.isMasked && (
              <form
                onSubmit={handleApplyToken}
                className="bg-sand-100/60 mt-4 flex flex-col items-center gap-2 border border-ink-950/10 p-3 sm:flex-row"
              >
                <div className="flex shrink-0 items-center gap-2 text-xs text-stone-600">
                  <KeyRound className="h-4 w-4 text-brass-500" />
                  <span>Have your confirmation token?</span>
                </div>
                <input
                  type="text"
                  placeholder="Paste 48-character token..."
                  value={enteredToken}
                  onChange={(e) => setEnteredToken(e.target.value)}
                  className="w-full rounded border border-ink-950/15 bg-white px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
                >
                  Unlock
                </button>
              </form>
            )}

            {booking.notes && (
              <div className="mt-4 border border-ink-950/10 bg-white p-3 text-xs text-stone-600">
                <span className="block text-[0.65rem] text-stone-400">Customer Notes</span>
                <p className="mt-0.5">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 border-t border-ink-950/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {!isCancelled ? (
              <button
                type="button"
                onClick={downloadCalendarFile}
                className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
              >
                <Download className="h-3.5 w-3.5" />
                Add to Calendar (.ics)
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              {booking.canCancel && !booking.isMasked && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-sm border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Cancel Booking
                </button>
              )}
              <Link to="/vehicles" className={buttonStyles({ variant: 'primary', size: 'md' })}>
                Browse Vehicle Catalogue
              </Link>
            </div>
          </div>
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md space-y-4 border border-ink-950/20 bg-ivory-50 p-6 shadow-xl">
              <h3 className="font-display text-xl text-ink-950">Cancel Appointment?</h3>
              <p className="text-xs leading-5 text-stone-600">
                Cancelling will release your reserved slot ({booking.bookingReference}) so other
                Lucknow customers can book it. This action cannot be undone.
              </p>

              {cancelError && (
                <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {cancelError}
                </div>
              )}

              <TextField
                label="Reason for cancellation (Optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
                  disabled={isCancelling}
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="rounded-sm bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
