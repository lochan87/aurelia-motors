export type TestDriveStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface DemoVehicleSummary {
  id: string;
  showroomId: string;
  variantId: string;
  variantName: string;
  modelName: string;
  registrationNumber: string;
  isActive: boolean;
}

export interface TestDriveSlot {
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  displayTime: string; // e.g. "10:00 AM - 10:45 AM IST"
  isAvailable: boolean;
  availableVehiclesCount: number;
}

export interface TestDriveAvailabilityResponse {
  showroomId: string;
  showroomCode: string;
  showroomName: string;
  variantId: string;
  variantName: string;
  modelName: string;
  date: string; // YYYY-MM-DD in Asia/Kolkata
  hasDemoVehicle: boolean;
  slots: TestDriveSlot[];
}

export interface CreateTestDriveBookingInput {
  showroomId: string;
  variantId: string;
  startTime: string; // ISO-8601 UTC
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  driverLicenseNumber?: string;
  notes?: string;
  consentGranted: boolean;
  idempotencyKey: string;
}

export interface TestDriveBookingConfirmation {
  bookingReference: string;
  confirmationToken: string;
  status: TestDriveStatus;
  startTime: string;
  endTime: string;
  showroom: {
    id: string;
    code: string;
    name: string;
    city: string;
    state: string;
  };
  vehicle: {
    modelName: string;
    variantName: string;
    demoRegistration: string;
  };
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  notes?: string | null;
  createdAt: string;
}
