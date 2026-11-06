export type StaffRole = 'ADMIN' | 'SALES_CONSULTANT' | 'USED_CAR_STAFF' | 'SERVICE_ADVISOR';

export interface StaffLocationSummary {
  showroomId?: string | null;
  showroomName?: string | null;
  showroomCode?: string | null;
  workshopId?: string | null;
  workshopName?: string | null;
  workshopCode?: string | null;
  isPrimary: boolean;
}

export interface StaffUserSummary {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  locations: StaffLocationSummary[];
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: StaffUserSummary;
  csrfToken: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateStaffInput {
  email: string;
  fullName: string;
  phone?: string;
  role: StaffRole;
  showroomIds?: string[];
  workshopIds?: string[];
  initialPassword?: string;
}

export interface UpdateStaffInput {
  fullName?: string;
  phone?: string | null;
  role?: StaffRole;
  isActive?: boolean;
  showroomIds?: string[];
  workshopIds?: string[];
}

export interface DashboardMetricOverview {
  role: StaffRole;
  user: StaffUserSummary;
  metrics: {
    inventoryTotal?: number;
    inventoryAvailable?: number;
    inventoryReserved?: number;
    inventorySold?: number;
    certifiedUsedCount?: number;
    testDrivesTotal?: number;
    servicesTotal?: number;
    todaysServicesCount?: number;
    activeStaffCount?: number;
    totalLeads?: number;
    newLeads?: number;
    assignedLeads?: number;
    overdueLeads?: number;
    averageResponseTimeMinutes?: number | null;
  };
  recentTestDrives: Array<{
    id: string;
    reference: string;
    modelName: string;
    customerName: string;
    time: string;
    showroomName: string;
    status: string;
  }>;
  recentServices: Array<{
    id: string;
    reference: string;
    serviceName: string;
    vehiclePlate: string;
    time: string;
    workshopName: string;
    status: string;
  }>;
  recentLeads?: Array<{
    id: string;
    reference: string;
    customerName: string;
    vehicleInterest: string;
    status: string;
    time: string;
    isOverdue: boolean;
  }>;
}
