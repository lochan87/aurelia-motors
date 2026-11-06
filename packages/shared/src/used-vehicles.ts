import type { FuelType, StockStatus, Transmission } from './catalogue.js';

export type InspectionRating = 'PASS' | 'ATTENTION' | 'FAIL';

export interface UsedInspectionItemSummary {
  id: string;
  category: string;
  label: string;
  rating: InspectionRating;
  notes?: string | null;
  sortOrder: number;
}

export interface UsedInspectionReport {
  id: string;
  version: number;
  inspectedAt: string;
  inspectorName: string;
  overallScore: number;
  summary: string;
  reportReference: string;
  items: UsedInspectionItemSummary[];
}

export interface UsedVehicleSummary {
  id: string;
  slug: string;
  make: string;
  modelName: string;
  variantName: string;
  registrationYear: number;
  registrationMonth?: number | null;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  ownershipCount: number;
  colourName: string;
  pricePaise: number;
  stockStatus: StockStatus;
  certified: boolean;
  registrationNumberMasked: string;
  overallScore: number | null;
  showroom: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
  thumbnailPlaceholderUrl: string;
}

export interface UsedVehicleDetail extends UsedVehicleSummary {
  description: string;
  highlights: string[];
  inspection: UsedInspectionReport | null;
  modelSlug?: string | null;
  variantSlug?: string | null;
}

export interface UsedVehicleFilterQuery {
  make?: string;
  fuelType?: FuelType;
  transmission?: Transmission;
  minYear?: number;
  maxYear?: number;
  minMileageKm?: number;
  maxMileageKm?: number;
  minPricePaise?: number;
  maxPricePaise?: number;
  showroomCode?: string;
  showroomId?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc';
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}
