export type BodyType = 'HATCHBACK' | 'SEDAN' | 'SUV' | 'CROSSOVER';
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC';
export type Transmission = 'MANUAL' | 'AUTOMATIC';
export type SpecificationGroup =
  'ENGINE' | 'PERFORMANCE' | 'DIMENSIONS' | 'SAFETY' | 'COMFORT' | 'TECHNOLOGY';

export type StockStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'IN_TRANSIT';

export interface VehicleColourSummary {
  id: string;
  name: string;
  hexCode: string;
  finish: string;
  sortOrder: number;
}

export interface VehicleImageSummary {
  id: string;
  url: string;
  altText: string;
  caption?: string | null;
  credit?: string | null;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface VehicleSpecificationSummary {
  id: string;
  group: SpecificationGroup;
  label: string;
  value: string;
  sortOrder: number;
}

export interface ShowroomInventorySummary {
  showroomId: string;
  showroomCode: string;
  showroomName: string;
  availableCount: number;
  reservedCount: number;
  inTransitCount: number;
  totalCount: number;
}

export interface VariantSummary {
  id: string;
  slug: string;
  name: string;
  fuelType: FuelType;
  transmission: Transmission;
  engineCapacityCc: number | null;
  powerBhp: number | null;
  torqueNm: number | null;
  seatingCapacity: number;
  sortOrder: number;
  startingPricePaise: number | null;
}

export interface VariantDetail extends VariantSummary {
  specifications: VehicleSpecificationSummary[];
  inventory: ShowroomInventorySummary[];
}

export interface ModelSummary {
  id: string;
  slug: string;
  make: string;
  name: string;
  bodyType: BodyType;
  summary: string;
  primaryImage: VehicleImageSummary | null;
  startingPricePaise: number | null;
  fuelTypes: FuelType[];
  transmissions: Transmission[];
  variantCount: number;
}

export interface ModelDetail {
  id: string;
  slug: string;
  make: string;
  name: string;
  bodyType: BodyType;
  summary: string;
  description: string;
  startingPricePaise: number | null;
  images: VehicleImageSummary[];
  colours: VehicleColourSummary[];
  variants: VariantDetail[];
}

export interface CatalogueFilterQuery {
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: Transmission;
  search?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc';
}
