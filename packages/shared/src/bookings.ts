export type UnifiedBookingType = 'TEST_DRIVE' | 'SERVICE';

export interface UnifiedBookingLocation {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
}

export interface UnifiedBookingCustomer {
  fullName: string;
  phone: string;
  email: string;
}

export interface UnifiedBookingDetails {
  bookingType: UnifiedBookingType;
  bookingReference: string;
  status: string;
  isMasked: boolean;
  startTime: string;
  endTime: string;
  location: UnifiedBookingLocation;
  title: string;
  subtitle: string;
  customer: UnifiedBookingCustomer;
  notes?: string | null;
  createdAt: string;
  canCancel: boolean;
  meta?: {
    estimatedCostPaise?: number;
    displayPrice?: string;
    demoRegistration?: string;
    vehicleRegistration?: string;
  };
}

export interface CancelBookingInput {
  confirmationToken: string;
  reason?: string;
}

export interface CancelBookingResult {
  bookingReference: string;
  status: string;
  message: string;
  cancelledAt: string;
}
