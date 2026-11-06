import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CreateServiceBookingInput } from '@aurelia/shared';
import { buttonStyles } from '../components/ui/button-styles';
import { Container } from '../components/ui/container';
import { TextField, TextareaField } from '../components/ui/form-controls';
import { SectionHeader } from '../components/ui/section-header';
import { api, ApiError } from '../lib/api-client';

export function ServiceBookingPage() {
  const navigate = useNavigate();

  // Fetch workshops
  const { data: workshops = [], isLoading: isWorkshopsLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => api.getWorkshops(),
  });

  // Fetch service types
  const { data: serviceTypes = [], isLoading: isServiceTypesLoading } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => api.getServiceTypes(),
  });

  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('');
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>('');

  // Active selections
  const activeWorkshopId = selectedWorkshopId || (workshops[0]?.id ?? '');
  const activeServiceTypeId = selectedServiceTypeId || (serviceTypes[0]?.id ?? '');

  // Default date to tomorrow (or Monday if tomorrow is Sunday)
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1); // skip Sunday
    }
    return d.toISOString().split('T')[0] ?? '';
  };

  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate());
  const [selectedSlotStartTime, setSelectedSlotStartTime] = useState<string>('');

  // Vehicle information
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [mileageKm, setMileageKm] = useState('');

  // Customer information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Availability query
  const {
    data: availability,
    isLoading: isAvailabilityLoading,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ['service-availability', activeWorkshopId, activeServiceTypeId, selectedDate],
    queryFn: () =>
      api.getServiceAvailability({
        workshopId: activeWorkshopId,
        serviceTypeId: activeServiceTypeId,
        date: selectedDate,
      }),
    enabled: Boolean(activeWorkshopId && activeServiceTypeId && selectedDate),
  });

  const activeWorkshop = workshops.find((w) => w.id === activeWorkshopId);
  const activeServiceType = serviceTypes.find((s) => s.id === activeServiceTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSlotStartTime) {
      setErrorMessage('Please select an available service time slot.');
      return;
    }

    if (!consentGranted) {
      setErrorMessage('Please accept the DPDP consent notice to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateServiceBookingInput = {
        workshopId: activeWorkshopId,
        serviceTypeId: activeServiceTypeId,
        startTime: selectedSlotStartTime,
        registrationNumber: registrationNumber.toUpperCase().trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
        currentMileageKm: mileageKm ? Number(mileageKm) : undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        notes: notes.trim() || undefined,
        consentGranted: true,
        idempotencyKey: `srv-web-${crypto.randomUUID()}`,
      };

      const result = await api.bookService(payload);
      navigate(
        `/bookings/confirmation/${result.bookingReference}?token=${result.confirmationToken}`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === 'WORKSHOP_CAPACITY_EXCEEDED') {
        setErrorMessage(
          'Workshop capacity for this slot was just reached. Please choose another time slot.',
        );
        refetchAvailability();
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while booking your service appointment.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isWorkshopsLoading || isServiceTypesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-ivory-50 py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="text-xs tracking-widest text-stone-600 uppercase">
            Loading authorized workshop schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory-50 py-12 sm:py-20">
      <Container>
        <SectionHeader
          index="04"
          eyebrow="Authorized Service"
          title={
            <>
              Book Workshop <em className="text-brass-500 italic">Service</em>
            </>
          }
          description="Capacity-checked appointments across our Gomti Nagar and Sushant Golf City workshops. Work is scheduled against real bay capacity with guaranteed turnaround."
        />

        <form onSubmit={handleSubmit} className="mt-12 space-y-12">
          {errorMessage && (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Workshop Location Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
                1
              </span>
              <h3 className="font-display text-xl text-ink-950">Select Workshop Location</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {workshops.map((workshop) => {
                const isSelected = activeWorkshopId === workshop.id;

                return (
                  <button
                    key={workshop.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkshopId(workshop.id);
                      setSelectedSlotStartTime('');
                    }}
                    className={`relative flex flex-col items-start border p-6 text-left transition-all ${
                      isSelected
                        ? 'bg-sand-100/70 border-brass-500 shadow-md ring-2 ring-brass-500/20'
                        : 'border-ink-950/10 bg-ivory-100 hover:border-brass-400/50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-4 right-4 rounded-full bg-brass-500 p-1 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}

                    <span className="text-[0.62rem] font-semibold tracking-wider text-stone-500 uppercase">
                      {workshop.code}
                    </span>
                    <h4 className="mt-1 font-display text-lg text-ink-950">{workshop.name}</h4>

                    <div className="mt-3 flex items-start gap-2 text-xs text-stone-600">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-500" />
                      <span>{workshop.address}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                      <Phone className="h-3.5 w-3.5 text-brass-500" />
                      <span>{workshop.phone}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-4 border-t border-ink-950/10 pt-3 text-[0.68rem] text-stone-500">
                      <span>{workshop.slotCapacity} bays per hour</span>
                      <span>·</span>
                      <span>Mon–Sat 08:30–18:30</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Service Package Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
                2
              </span>
              <h3 className="font-display text-xl text-ink-950">Select Service Package</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceTypes.map((type) => {
                const isSelected = activeServiceTypeId === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceTypeId(type.id);
                      setSelectedSlotStartTime('');
                    }}
                    className={`relative flex flex-col justify-between border p-5 text-left transition-all ${
                      isSelected
                        ? 'bg-sand-100/70 border-brass-500 shadow-md ring-2 ring-brass-500/20'
                        : 'border-ink-950/10 bg-ivory-100 hover:border-brass-400/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-brass-500">
                          <Wrench className="h-3.5 w-3.5" />
                          {type.durationMinutes} Minutes
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-brass-500 p-0.5 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 font-display text-base text-ink-950">{type.name}</h4>
                      <p className="mt-2 text-xs leading-5 text-stone-600">{type.description}</p>
                    </div>

                    <div className="mt-5 flex items-baseline justify-between border-t border-ink-950/10 pt-3">
                      <span className="text-[0.65rem] tracking-wider text-stone-500 uppercase">
                        Estimate
                      </span>
                      <span className="font-display text-lg font-bold text-ink-950">
                        {type.displayPrice}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Date & Capacity-Checked Slot Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
                3
              </span>
              <h3 className="font-display text-xl text-ink-950">Select Date & Capacity Slot</h3>
            </div>

            <div className="space-y-6 border border-ink-950/10 bg-ivory-100 p-6">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                  Service Date *
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

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wider text-ink-900 uppercase">
                    Available Bay Slots ({activeServiceType?.durationMinutes}m window) *
                  </label>
                  {isAvailabilityLoading && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] text-stone-500">
                      <Loader2 className="h-3 w-3 animate-spin text-brass-500" />
                      Verifying workshop bay capacity...
                    </span>
                  )}
                </div>

                {availability && !availability.isOpen && (
                  <div className="mt-3 border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    {activeWorkshop?.name} is closed on Sundays. Please select a Monday through
                    Saturday date.
                  </div>
                )}

                {availability?.isOpen && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {availability.slots.map((slot) => {
                      const isSelected = selectedSlotStartTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlotStartTime(slot.startTime)}
                          className={`flex flex-col items-center justify-center rounded border p-3 text-center transition-all ${
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
                              ? `${slot.capacityRemaining} bay${slot.capacityRemaining > 1 ? 's' : ''} available`
                              : 'Capacity full'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. Vehicle & Customer Information */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass-400 text-xs font-bold text-ink-950">
                4
              </span>
              <h3 className="font-display text-xl text-ink-950">Vehicle & Contact Details</h3>
            </div>

            <div className="space-y-6 border border-ink-950/10 bg-ivory-100 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Vehicle Registration Number"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. UP32 AB 1234"
                  hint="Enter your vehicle registration plate as shown on RC."
                />
                <TextField
                  label="Vehicle Make & Model"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. Vantara Lumen Petrol AT"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Model Year"
                  type="number"
                  min={1990}
                  max={2026}
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                  placeholder="e.g. 2024"
                />
                <TextField
                  label="Current Odometer (km)"
                  type="number"
                  min={0}
                  value={mileageKm}
                  onChange={(e) => setMileageKm(e.target.value)}
                  placeholder="e.g. 15400"
                />
              </div>

              <div className="grid gap-4 border-t border-ink-950/10 pt-4 sm:grid-cols-3">
                <TextField
                  label="Customer Full Name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Aditya Srivastava"
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <TextField
                  label="Email Address"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="aditya@example.com"
                />
              </div>

              <TextareaField
                label="Specific Concerns or Symptoms (Optional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. AC cooling takes 10 minutes to stabilize; noise from left front wheel over speed breakers."
              />

              {/* DPDP Consent */}
              <div className="flex items-start gap-3 border border-ink-950/10 bg-sand-200/40 p-4">
                <input
                  type="checkbox"
                  id="dpdp-service-consent"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-950/20 text-brass-500 focus:ring-brass-500"
                  required
                />
                <label htmlFor="dpdp-service-consent" className="text-xs leading-5 text-stone-700">
                  I consent to Aurelia Motors processing my vehicle registration and contact details
                  for workshop appointment coordination and service history tracking under the
                  Digital Personal Data Protection (DPDP) Act.
                </label>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-4 border-t border-ink-950/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="h-4 w-4 text-brass-500" />
              <span>
                Real-time bay capacity reserved upon confirmation. No booking deposit required.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSlotStartTime || !consentGranted}
              className={buttonStyles({ variant: 'primary', size: 'lg' })}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reserving Workshop Bay...
                </>
              ) : (
                'Confirm Service Booking'
              )}
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}
