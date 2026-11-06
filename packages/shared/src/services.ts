export type ServiceStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface WorkshopOperatingHoursSummary {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface WorkshopSummary {
  id: string;
  showroomId: string;
  showroomName: string;
  name: string;
  code: string;
  slotCapacity: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  operatingHours: WorkshopOperatingHoursSummary[];
}

export interface ServiceTypeSummary {
  id: string;
  code: string;
  name: string;
  description: string;
  durationMinutes: number;
  basePricePaise: number;
  displayPrice: string;
}

export interface ServiceSlot {
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  displayTime: string; // e.g. "09:00 AM - 11:00 AM IST"
  isAvailable: boolean;
  capacityRemaining: number;
}

export interface ServiceAvailabilityResponse {
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  serviceTypeId: string;
  serviceTypeName: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD in Asia/Kolkata
  isOpen: boolean;
  slots: ServiceSlot[];
}

export interface CreateServiceBookingInput {
  workshopId: string;
  serviceTypeId: string;
  startTime: string; // ISO-8601 UTC
  registrationNumber: string;
  vehicleModel: string;
  vehicleYear?: number;
  currentMileageKm?: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  consentGranted: boolean;
  idempotencyKey: string;
}

export interface ServiceBookingConfirmation {
  bookingReference: string;
  confirmationToken: string;
  status: ServiceStatus;
  startTime: string;
  endTime: string;
  workshop: {
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
  };
  serviceType: {
    id: string;
    name: string;
    durationMinutes: number;
    estimatedCostPaise: number;
    displayPrice: string;
  };
  vehicle: {
    registrationNumber: string;
    modelName: string;
    year?: number | null;
    mileageKm?: number | null;
  };
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  notes?: string | null;
  createdAt: string;
}
