import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  calculateTradeInEstimate,
  formatInrFromPaise,
  type VehicleCondition,
} from '@aurelia/shared';
import { apiClient } from '../../lib/api-client.js';

interface TradeInModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMake?: string;
  defaultModel?: string;
}

export function TradeInModal({
  isOpen,
  onClose,
  defaultMake = '',
  defaultModel = '',
}: TradeInModalProps) {
  const [make, setMake] = useState(defaultMake);
  const [model, setModel] = useState(defaultModel);
  const [variant, setVariant] = useState('');
  const [registrationYear, setRegistrationYear] = useState<number>(2022);
  const [mileageKm, setMileageKm] = useState<number>(35000);
  const [condition, setCondition] = useState<VehicleCondition>('GOOD');
  const [ownershipCount, setOwnershipCount] = useState<number>(1);
  const [fuelType, setFuelType] = useState('PETROL');
  const [transmission, setTransmission] = useState('MANUAL');
  const [showroomId, setShowroomId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch showrooms for dropdown
  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => apiClient.getShowrooms(),
  });

  if (!isOpen) return null;

  // Calculate live instant estimate
  const estimate =
    make && model
      ? calculateTradeInEstimate({
          baseReferencePricePaise: 110_000_000,
          registrationYear,
          currentYear: 2026,
          mileageKm,
          condition,
          ownershipCount,
        })
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!showroomId) {
      setErrorMessage('Please select an Aurelia Motors showroom location.');
      return;
    }

    if (!privacyConsent) {
      setErrorMessage('Please accept the privacy consent under DPDP Act 2023 to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.submitTradeIn({
        fullName,
        phone,
        email,
        showroomId,
        make,
        model,
        variant: variant || undefined,
        registrationYear,
        mileageKm,
        ownershipCount,
        condition,
        fuelType,
        transmission,
        customerNotes: customerNotes || undefined,
        privacyConsent,
      });

      setSubmittedReference(res.reference);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit trade-in request. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedReference(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <span className="sr-only">Close</span>✕
        </button>

        {submittedReference ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
              ✓
            </div>
            <h3 className="mt-4 font-serif text-2xl font-bold text-stone-900">
              Valuation Request Submitted
            </h3>
            <p className="mt-2 text-sm text-stone-600">Your trade-in reference number is:</p>
            <div className="mt-3 inline-block rounded-lg bg-stone-100 px-4 py-2 font-mono text-lg font-bold text-stone-900">
              {submittedReference}
            </div>
            {estimate && (
              <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left">
                <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  Illustrative Valuation Range
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                  {formatInrFromPaise(estimate.estimatedValuationMinPaise)} –{' '}
                  {formatInrFromPaise(estimate.estimatedValuationMaxPaise)}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
                  {estimate.disclaimer}
                </p>
              </div>
            )}
            <p className="mt-6 text-sm text-stone-600">
              Our showroom valuation specialist will contact you on {phone} to schedule a physical
              140-point inspection.
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-6 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Aurelia Exchange Assurance
              </span>
              <h3 className="mt-1 font-serif text-2xl text-stone-900">Value Your Existing Car</h3>
              <p className="text-xs text-stone-500">
                Transparent doorstep evaluation and highest exchange bonus across Lucknow
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {errorMessage}
              </div>
            )}

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-stone-700">Make / Brand *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honda, Hyundai, Maruti"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City, Creta, Swift"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Variant / Trim</label>
                <input
                  type="text"
                  placeholder="e.g. ZX CVT, SX(O)"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Registration Year *</label>
                <select
                  value={registrationYear}
                  onChange={(e) => setRegistrationYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Kilometres Driven *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={mileageKm}
                  onChange={(e) => setMileageKm(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Overall Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as VehicleCondition)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  <option value="EXCELLENT">Excellent (Flawless paint & mechanicals)</option>
                  <option value="GOOD">Good (Normal wear, fully functional)</option>
                  <option value="FAIR">Fair (Minor dings, service required)</option>
                  <option value="POOR">Poor (Needs significant repair)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">Ownership History</label>
                <select
                  value={ownershipCount}
                  onChange={(e) => setOwnershipCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  <option value={1}>1st Owner</option>
                  <option value={2}>2nd Owner</option>
                  <option value={3}>3rd Owner or more</option>
                </select>
              </div>
            </div>

            {/* Instant Estimate Banner */}
            {estimate && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-amber-900">
                    Estimated Trade-In Band
                  </span>
                  <span className="font-mono text-lg font-bold text-amber-900">
                    {formatInrFromPaise(estimate.estimatedValuationMinPaise)} –{' '}
                    {formatInrFromPaise(estimate.estimatedValuationMaxPaise)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800">
                  Estimated based on {registrationYear} {make} {model} with{' '}
                  {mileageKm.toLocaleString('en-IN')} km.
                </p>
              </div>
            )}

            {/* Customer Details */}
            <div className="border-t border-stone-200 pt-4">
              <h4 className="text-xs font-bold tracking-wider text-stone-600 uppercase">
                Evaluation Showroom & Contact Info
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="preferred-showroom-select"
                    className="text-xs font-medium text-stone-700"
                  >
                    Preferred Showroom *
                  </label>
                  <select
                    id="preferred-showroom-select"
                    required
                    value={showroomId}
                    onChange={(e) => setShowroomId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  >
                    <option value="">Select Showroom Location</option>
                    {showrooms?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-stone-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-stone-700">Additional Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any accessories, service record history, or new car upgrade preferences..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Consent */}
            <div className="rounded-lg bg-stone-50 p-3">
              <label className="flex items-start gap-2.5 text-xs text-stone-600">
                <input
                  type="checkbox"
                  required
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                <span>
                  I consent to Aurelia Motors processing my vehicle and contact information to
                  evaluate my trade-in and communicate valuation offers in compliance with the
                  Digital Personal Data Protection Act, 2023.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Request Inspection & Valuation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
