import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Loader2, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';

import type {
  CreateEnquiryInput,
  CreateEnquiryResponse,
  PreferredContactMethod,
} from '@aurelia/shared';
import { api, ApiError } from '../../lib/api-client';
import { buttonStyles } from '../ui/button-styles';
import { TextField, TextareaField } from '../ui/form-controls';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedModelId?: string;
  preselectedVariantId?: string;
  preselectedUsedVehicleId?: string;
  vehicleTitle?: string;
  defaultShowroomId?: string;
}

export function EnquiryModal({
  isOpen,
  onClose,
  preselectedModelId,
  preselectedVariantId,
  preselectedUsedVehicleId,
  vehicleTitle,
  defaultShowroomId,
}: EnquiryModalProps) {
  const { data: showrooms = [] } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
    enabled: isOpen,
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.getModels(),
    enabled: isOpen && !preselectedModelId && !preselectedUsedVehicleId,
  });

  const [selectedShowroomId, setSelectedShowroomId] = useState<string>(
    defaultShowroomId || (showrooms[0]?.id ?? ''),
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(preselectedModelId || '');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactMethod, setContactMethod] = useState<PreferredContactMethod>('PHONE');
  const [requirements, setRequirements] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CreateEnquiryResponse | null>(null);

  if (!isOpen) return null;

  const activeShowroomId = selectedShowroomId || (showrooms[0]?.id ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!privacyConsent) {
      setErrorMessage(
        'Please accept the DPDP Act 2023 privacy consent notice to submit your enquiry.',
      );
      return;
    }

    if (!activeShowroomId) {
      setErrorMessage('Please select a showroom.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateEnquiryInput = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        showroomId: activeShowroomId,
        modelId: preselectedModelId || selectedModelId || undefined,
        variantId: preselectedVariantId || undefined,
        usedVehicleId: preselectedUsedVehicleId || undefined,
        preferredContactMethod: contactMethod,
        customerRequirements: requirements.trim() || undefined,
        privacyConsent: true,
      };

      const response = await api.createEnquiry(payload);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_ENQUIRY') {
          setErrorMessage(
            'We already have an active enquiry for this contact and vehicle. A dedicated sales consultant is already attending to your request.',
          );
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(
          'Failed to submit enquiry. Please try again or call our showroom directly.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setRequirements('');
    setPrivacyConsent(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleReset}
      />

      {/* Modal Dialog */}
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto border border-ivory-50/20 bg-ivory-50 text-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-950/10 bg-ivory-100/70 px-6 py-4">
          <div>
            <span className="text-brass-700 text-[0.6rem] font-semibold tracking-[0.24em] uppercase">
              Aurelia Motors · Client Advisory
            </span>
            <h2 id="enquiry-modal-title" className="font-display text-xl text-ink-950 sm:text-2xl">
              {vehicleTitle ? `Enquire about ${vehicleTitle}` : 'Vehicle & Showroom Enquiry'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="hover:bg-ivory-200 rounded-full p-1.5 text-stone-500 transition-colors hover:text-ink-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {result ? (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                  Enquiry Reference Code
                </span>
                <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink-950">
                  {result.leadReference}
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50/70 p-4 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div className="text-xs leading-relaxed text-emerald-900">
                    <p className="text-sm font-semibold">30-Minute Response Commitment</p>
                    <p className="mt-1">
                      Your enquiry has been received and routed directly to a dedicated sales
                      consultant at our showroom. During working hours (10:00 AM – 7:30 PM), a
                      consultant will contact you via your preferred method within 30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className={buttonStyles({ variant: 'primary', size: 'md', className: 'w-full' })}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Context Summary */}
              {vehicleTitle && (
                <div className="flex items-center justify-between rounded border border-ink-950/10 bg-ivory-100/50 p-3.5 text-xs text-stone-700">
                  <span className="font-medium text-ink-950">Vehicle of interest:</span>
                  <span className="text-brass-700 font-semibold">{vehicleTitle}</span>
                </div>
              )}

              {/* Showroom Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  Preferred Showroom <span className="text-red-500">*</span>
                </label>
                <select
                  value={activeShowroomId}
                  onChange={(e) => setSelectedShowroomId(e.target.value)}
                  className="w-full border border-ink-950/20 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brass-500 focus:outline-none"
                  required
                >
                  {showrooms.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.name} — {sh.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* If no vehicle preselected, allow model selection */}
              {!preselectedModelId && !preselectedUsedVehicleId && models.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Model of Interest (Optional)
                  </label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full border border-ink-950/20 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brass-500 focus:outline-none"
                  >
                    <option value="">General Dealership Enquiry</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.bodyType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Full Name *"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rathore"
                  required
                />
                <TextField
                  label="Mobile Number (India) *"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Email Address *"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. vikram@example.com"
                  required
                />

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Preferred Contact Method
                  </label>
                  <select
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value as PreferredContactMethod)}
                    className="w-full border border-ink-950/20 bg-white px-3.5 py-2.5 text-sm text-ink-950 focus:border-brass-500 focus:outline-none"
                  >
                    <option value="PHONE">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>

              {/* Additional Requirements */}
              <TextareaField
                label="Specific Requirements / Questions (Optional)"
                name="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Share any specific colour preference, expected delivery timeline, or corporate leasing questions..."
                rows={3}
              />

              {/* DPDP Consent */}
              <div className="rounded border border-ink-950/10 bg-ivory-100/60 p-3.5 text-xs">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="text-brass-600 mt-0.5 h-4 w-4 rounded border-ink-950/30 focus:ring-brass-500"
                    required
                  />
                  <span className="leading-snug text-stone-700">
                    I consent to Aurelia Motors contacting me regarding this enquiry in accordance
                    with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. My
                    details will only be used by authorized dealership personnel for consultation
                    and will not be shared with unauthorized third parties.
                  </span>
                </label>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded border border-red-300 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Enquiry...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Submit Enquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
