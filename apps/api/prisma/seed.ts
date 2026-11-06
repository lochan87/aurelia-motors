import 'dotenv/config';
import argon2 from 'argon2';

import {
  BodyType,
  FuelType,
  InspectionRating,
  PriceBookStatus,
  PriceCalculation,
  PriceComponentCategory,
  PriceKind,
  PrismaClient,
  SpecificationGroup,
  StaffRole,
  StockStatus,
  Transmission,
} from '@prisma/client';

/**
 * Repeatable sample data for the catalogue milestone.
 *
 * Every record here is fictional. Prices, taxes, and inspection findings are
 * illustrative sample values, not quotations or official rates. The seed uses
 * upserts only, so running it repeatedly does not duplicate or delete data.
 */

const prisma = new PrismaClient();

interface ShowroomSeed {
  code: string;
  name: string;
  isActive: boolean;
}

const showroomSeeds: ShowroomSeed[] = [
  { code: 'LKO-CENTRAL', name: 'Central Lucknow', isActive: true },
  { code: 'LKO-GOMTI', name: 'Gomti Nagar', isActive: true },
  { code: 'LKO-SGC', name: 'Sushant Golf City', isActive: true },
];

interface ColourSeed {
  name: string;
  hexCode: string;
  finish: string;
}

interface VariantSeed {
  slug: string;
  name: string;
  fuelType: FuelType;
  transmission: Transmission;
  engineCapacityCc: number | null;
  powerBhp: number;
  torqueNm: number;
  batteryKwh?: number;
  rangeKm?: number;
  efficiency?: string;
  exShowroomPaise: number;
}

interface ModelSeed {
  slug: string;
  make: string;
  name: string;
  bodyType: BodyType;
  summary: string;
  description: string;
  dimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    wheelbaseMm: number;
    bootLitres: number;
  };
  colours: ColourSeed[];
  variants: VariantSeed[];
}

const modelSeeds: ModelSeed[] = [
  {
    slug: 'vantara-lumen',
    make: 'Vantara',
    name: 'Lumen',
    bodyType: BodyType.CROSSOVER,
    summary: 'A compact crossover built around calm, clear space.',
    description:
      'The Lumen is the fictional Vantara compact crossover used throughout this sample catalogue. It pairs a raised driving position with a cabin designed for long Lucknow commutes. Petrol, diesel, and automatic options are represented in the sample inventory.',
    dimensions: {
      lengthMm: 4310,
      widthMm: 1800,
      heightMm: 1640,
      wheelbaseMm: 2610,
      bootLitres: 433,
    },
    colours: [
      { name: 'Moonstone White', hexCode: '#F4F2ED', finish: 'Pearl' },
      { name: 'Graphite Grey', hexCode: '#4A4F52', finish: 'Metallic' },
      { name: 'Forest Green', hexCode: '#2F4A3D', finish: 'Metallic' },
      { name: 'Copper Sand', hexCode: '#B57B4A', finish: 'Matte' },
    ],
    variants: [
      {
        slug: 'vantara-lumen-petrol-mt',
        name: '1.5 Petrol MT',
        fuelType: FuelType.PETROL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 1497,
        powerBhp: 113,
        torqueNm: 148,
        efficiency: '17.2 km/l (sample)',
        exShowroomPaise: 114_900_000,
      },
      {
        slug: 'vantara-lumen-petrol-automatic',
        name: '1.5 Petrol Automatic',
        fuelType: FuelType.PETROL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 1497,
        powerBhp: 120,
        torqueNm: 152,
        efficiency: '16.4 km/l (sample)',
        exShowroomPaise: 127_900_000,
      },
      {
        slug: 'vantara-lumen-diesel-mt',
        name: '1.5 Diesel MT',
        fuelType: FuelType.DIESEL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 1497,
        powerBhp: 116,
        torqueNm: 250,
        efficiency: '20.1 km/l (sample)',
        exShowroomPaise: 129_900_000,
      },
    ],
  },
  {
    slug: 'vantara-meridian',
    make: 'Vantara',
    name: 'Meridian',
    bodyType: BodyType.SEDAN,
    summary: 'A quiet sedan for the meetings and the drives between them.',
    description:
      'The Meridian is a fictional executive sedan in the sample catalogue. Its variants cover petrol manual, petrol automatic, and diesel automatic powertrains. The long wheelbase and boot figures are illustrative sample specifications.',
    dimensions: {
      lengthMm: 4720,
      widthMm: 1825,
      heightMm: 1480,
      wheelbaseMm: 2740,
      bootLitres: 510,
    },
    colours: [
      { name: 'Ivory Pearl', hexCode: '#EDE8DA', finish: 'Pearl' },
      { name: 'Midnight Blue', hexCode: '#1E2B3C', finish: 'Metallic' },
      { name: 'Gunmetal Grey', hexCode: '#55585C', finish: 'Metallic' },
      { name: 'Bordeaux Red', hexCode: '#6E2733', finish: 'Metallic' },
    ],
    variants: [
      {
        slug: 'vantara-meridian-petrol-mt',
        name: '1.5 Petrol MT',
        fuelType: FuelType.PETROL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 1497,
        powerBhp: 118,
        torqueNm: 155,
        efficiency: '16.8 km/l (sample)',
        exShowroomPaise: 154_900_000,
      },
      {
        slug: 'vantara-meridian-petrol-automatic',
        name: '1.5 Petrol Automatic',
        fuelType: FuelType.PETROL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 1497,
        powerBhp: 126,
        torqueNm: 160,
        efficiency: '15.9 km/l (sample)',
        exShowroomPaise: 169_900_000,
      },
      {
        slug: 'vantara-meridian-diesel-automatic',
        name: '2.0 Diesel Automatic',
        fuelType: FuelType.DIESEL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 1956,
        powerBhp: 148,
        torqueNm: 350,
        efficiency: '19.4 km/l (sample)',
        exShowroomPaise: 194_900_000,
      },
    ],
  },
  {
    slug: 'vantara-solace',
    make: 'Vantara',
    name: 'Solace',
    bodyType: BodyType.HATCHBACK,
    summary: 'The small car that refuses to feel like a compromise.',
    description:
      'The Solace is the fictional compact hatchback in this catalogue. It is offered with petrol manual and automatic choices, including a turbocharged variant. All specifications and prices are sample values for the assignment.',
    dimensions: {
      lengthMm: 3840,
      widthMm: 1740,
      heightMm: 1520,
      wheelbaseMm: 2450,
      bootLitres: 318,
    },
    colours: [
      { name: 'Alpine White', hexCode: '#F7F6F1', finish: 'Solid' },
      { name: 'Sky Blue', hexCode: '#7FA6BD', finish: 'Metallic' },
      { name: 'Charcoal', hexCode: '#3A3D3F', finish: 'Metallic' },
      { name: 'Brass Gold', hexCode: '#B08B52', finish: 'Metallic' },
    ],
    variants: [
      {
        slug: 'vantara-solace-petrol-mt',
        name: '1.2 Petrol MT',
        fuelType: FuelType.PETROL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 1197,
        powerBhp: 88,
        torqueNm: 113,
        efficiency: '20.6 km/l (sample)',
        exShowroomPaise: 74_900_000,
      },
      {
        slug: 'vantara-solace-petrol-automatic',
        name: '1.2 Petrol Automatic',
        fuelType: FuelType.PETROL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 1197,
        powerBhp: 90,
        torqueNm: 115,
        efficiency: '19.8 km/l (sample)',
        exShowroomPaise: 82_900_000,
      },
      {
        slug: 'vantara-solace-turbo-petrol-mt',
        name: '1.0 Turbo Petrol MT',
        fuelType: FuelType.PETROL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 998,
        powerBhp: 99,
        torqueNm: 172,
        efficiency: '19.1 km/l (sample)',
        exShowroomPaise: 89_900_000,
      },
    ],
  },
  {
    slug: 'vantara-kestrel',
    make: 'Vantara',
    name: 'Kestrel',
    bodyType: BodyType.SUV,
    summary: 'A seven-seat SUV for the week, the weekend, and the detour.',
    description:
      'The Kestrel is a fictional three-row SUV in the sample catalogue. Petrol automatic, diesel manual, and diesel automatic variants are represented. Dimensions, outputs, and prices are illustrative only.',
    dimensions: {
      lengthMm: 4795,
      widthMm: 1900,
      heightMm: 1785,
      wheelbaseMm: 2820,
      bootLitres: 238,
    },
    colours: [
      { name: 'Basalt Black', hexCode: '#22252A', finish: 'Metallic' },
      { name: 'Sandstone Beige', hexCode: '#C6B79B', finish: 'Matte' },
      { name: 'Deep Forest', hexCode: '#233A30', finish: 'Metallic' },
      { name: 'Steel Silver', hexCode: '#9EA3A6', finish: 'Metallic' },
    ],
    variants: [
      {
        slug: 'vantara-kestrel-petrol-automatic',
        name: '2.0 Petrol Automatic',
        fuelType: FuelType.PETROL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 1997,
        powerBhp: 164,
        torqueNm: 280,
        efficiency: '13.2 km/l (sample)',
        exShowroomPaise: 244_900_000,
      },
      {
        slug: 'vantara-kestrel-diesel-mt',
        name: '2.2 Diesel MT',
        fuelType: FuelType.DIESEL,
        transmission: Transmission.MANUAL,
        engineCapacityCc: 2198,
        powerBhp: 172,
        torqueNm: 400,
        efficiency: '16.1 km/l (sample)',
        exShowroomPaise: 234_900_000,
      },
      {
        slug: 'vantara-kestrel-diesel-automatic',
        name: '2.2 Diesel Automatic',
        fuelType: FuelType.DIESEL,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: 2198,
        powerBhp: 178,
        torqueNm: 420,
        efficiency: '15.4 km/l (sample)',
        exShowroomPaise: 264_900_000,
      },
    ],
  },
  {
    slug: 'vantara-aria',
    make: 'Vantara',
    name: 'Aria',
    bodyType: BodyType.CROSSOVER,
    summary: 'An electric crossover with a quieter kind of confidence.',
    description:
      'The Aria is the fictional electric crossover in the sample catalogue. Range, battery, and charging figures are indicative sample values, not certified test results. Three electric variants are represented.',
    dimensions: {
      lengthMm: 4460,
      widthMm: 1865,
      heightMm: 1620,
      wheelbaseMm: 2700,
      bootLitres: 402,
    },
    colours: [
      { name: 'Glacier White', hexCode: '#F2F4F3', finish: 'Pearl' },
      { name: 'Electric Teal', hexCode: '#2F6F6B', finish: 'Metallic' },
      { name: 'Midnight', hexCode: '#1C2426', finish: 'Metallic' },
      { name: 'Copper Glow', hexCode: '#B4724E', finish: 'Matte' },
    ],
    variants: [
      {
        slug: 'vantara-aria-ev-standard',
        name: 'EV Standard Range',
        fuelType: FuelType.ELECTRIC,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: null,
        powerBhp: 154,
        torqueNm: 310,
        batteryKwh: 48,
        rangeKm: 430,
        efficiency: '430 km range (sample)',
        exShowroomPaise: 249_900_000,
      },
      {
        slug: 'vantara-aria-ev-long-range',
        name: 'EV Long Range',
        fuelType: FuelType.ELECTRIC,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: null,
        powerBhp: 186,
        torqueNm: 330,
        batteryKwh: 62,
        rangeKm: 520,
        efficiency: '520 km range (sample)',
        exShowroomPaise: 294_900_000,
      },
      {
        slug: 'vantara-aria-ev-long-range-awd',
        name: 'EV Long Range AWD',
        fuelType: FuelType.ELECTRIC,
        transmission: Transmission.AUTOMATIC,
        engineCapacityCc: null,
        powerBhp: 232,
        torqueNm: 460,
        batteryKwh: 62,
        rangeKm: 485,
        efficiency: '485 km range (sample)',
        exShowroomPaise: 334_900_000,
      },
    ],
  },
];

const catalogueImages: Array<{ sortOrder: number; suffix: string; caption: string }> = [
  { sortOrder: 0, suffix: 'exterior', caption: 'Illustrated exterior profile' },
  { sortOrder: 1, suffix: 'interior', caption: 'Illustrated cabin view' },
];

interface PriceComponentSeed {
  code: string;
  label: string;
  category: PriceComponentCategory;
  calculation: PriceCalculation;
  amountPaise?: number;
  rateBasisPoints?: number;
  isOptional: boolean;
  sortOrder: number;
}

const showroomPricing: Record<
  string,
  { insuranceBps: number; registrationPaise: number; accessoriesPaise: number }
> = {
  'LKO-CENTRAL': { insuranceBps: 350, registrationPaise: 120_000, accessoriesPaise: 180_000 },
  'LKO-GOMTI': { insuranceBps: 365, registrationPaise: 125_000, accessoriesPaise: 150_000 },
  'LKO-SGC': { insuranceBps: 340, registrationPaise: 118_000, accessoriesPaise: 200_000 },
};

function buildPriceComponents(showroomCode: string): PriceComponentSeed[] {
  const config = showroomPricing[showroomCode];

  if (!config) {
    throw new Error(`No sample pricing configuration for showroom ${showroomCode}.`);
  }

  return [
    {
      code: 'ROAD_TAX',
      label: 'Road tax (sample rate)',
      category: PriceComponentCategory.ROAD_TAX,
      calculation: PriceCalculation.PERCENT_OF_EXSHOWROOM,
      rateBasisPoints: 800,
      isOptional: false,
      sortOrder: 10,
    },
    {
      code: 'INSURANCE',
      label: 'Comprehensive insurance (sample estimate)',
      category: PriceComponentCategory.INSURANCE,
      calculation: PriceCalculation.PERCENT_OF_EXSHOWROOM,
      rateBasisPoints: config.insuranceBps,
      isOptional: false,
      sortOrder: 20,
    },
    {
      code: 'REGISTRATION',
      label: 'RTO registration and handling (sample)',
      category: PriceComponentCategory.REGISTRATION,
      calculation: PriceCalculation.FIXED,
      amountPaise: config.registrationPaise,
      isOptional: false,
      sortOrder: 30,
    },
    {
      code: 'LOGISTICS',
      label: 'Logistics and documentation (sample)',
      category: PriceComponentCategory.OTHER,
      calculation: PriceCalculation.FIXED,
      amountPaise: 50_000,
      isOptional: false,
      sortOrder: 40,
    },
    {
      code: 'ACCESSORY_PACK',
      label: 'Accessory pack (optional, sample)',
      category: PriceComponentCategory.ACCESSORIES,
      calculation: PriceCalculation.FIXED,
      amountPaise: config.accessoriesPaise,
      isOptional: true,
      sortOrder: 50,
    },
    {
      code: 'EXTENDED_WARRANTY',
      label: 'Extended warranty (optional, sample)',
      category: PriceComponentCategory.OTHER,
      calculation: PriceCalculation.FIXED,
      amountPaise: 250_000,
      isOptional: true,
      sortOrder: 60,
    },
  ];
}

function buildSpecifications(
  variant: VariantSeed,
  model: ModelSeed,
): Array<{
  group: SpecificationGroup;
  label: string;
  value: string;
  sortOrder: number;
}> {
  const dimensions = model.dimensions;
  const specifications: Array<{
    group: SpecificationGroup;
    label: string;
    value: string;
    sortOrder: number;
  }> = [];

  if (variant.fuelType === FuelType.ELECTRIC) {
    specifications.push(
      {
        group: SpecificationGroup.ENGINE,
        label: 'Battery pack',
        value: `${variant.batteryKwh ?? 0} kWh lithium-ion (sample)`,
        sortOrder: 10,
      },
      {
        group: SpecificationGroup.ENGINE,
        label: 'Indicative range',
        value: `${variant.rangeKm ?? 0} km (sample)`,
        sortOrder: 20,
      },
      {
        group: SpecificationGroup.ENGINE,
        label: 'Charging',
        value: '11 kW AC / 50 kW DC (sample)',
        sortOrder: 30,
      },
    );
  } else {
    const litres = ((variant.engineCapacityCc ?? 0) / 1000).toFixed(1);

    specifications.push(
      {
        group: SpecificationGroup.ENGINE,
        label: 'Engine',
        value: `${litres} L ${variant.fuelType === FuelType.DIESEL ? 'diesel' : 'petrol'}`,
        sortOrder: 10,
      },
      {
        group: SpecificationGroup.ENGINE,
        label: 'Displacement',
        value: `${(variant.engineCapacityCc ?? 0).toLocaleString('en-IN')} cc`,
        sortOrder: 20,
      },
      {
        group: SpecificationGroup.ENGINE,
        label: 'Max power',
        value: `${variant.powerBhp} bhp (sample)`,
        sortOrder: 30,
      },
      {
        group: SpecificationGroup.ENGINE,
        label: 'Max torque',
        value: `${variant.torqueNm} Nm (sample)`,
        sortOrder: 40,
      },
    );
  }

  specifications.push(
    {
      group: SpecificationGroup.PERFORMANCE,
      label: 'Transmission',
      value: variant.transmission === Transmission.AUTOMATIC ? 'Automatic' : 'Manual',
      sortOrder: 10,
    },
    {
      group: SpecificationGroup.PERFORMANCE,
      label: 'Drive',
      value: variant.slug.endsWith('-awd') ? 'All-wheel drive' : 'Front-wheel drive',
      sortOrder: 20,
    },
    {
      group: SpecificationGroup.PERFORMANCE,
      label: variant.fuelType === FuelType.ELECTRIC ? 'Range' : 'Fuel efficiency',
      value: variant.efficiency ?? 'Sample value',
      sortOrder: 30,
    },
    {
      group: SpecificationGroup.DIMENSIONS,
      label: 'Length',
      value: `${dimensions.lengthMm.toLocaleString('en-IN')} mm`,
      sortOrder: 10,
    },
    {
      group: SpecificationGroup.DIMENSIONS,
      label: 'Width',
      value: `${dimensions.widthMm.toLocaleString('en-IN')} mm`,
      sortOrder: 20,
    },
    {
      group: SpecificationGroup.DIMENSIONS,
      label: 'Height',
      value: `${dimensions.heightMm.toLocaleString('en-IN')} mm`,
      sortOrder: 30,
    },
    {
      group: SpecificationGroup.DIMENSIONS,
      label: 'Wheelbase',
      value: `${dimensions.wheelbaseMm.toLocaleString('en-IN')} mm`,
      sortOrder: 40,
    },
    {
      group: SpecificationGroup.DIMENSIONS,
      label: 'Boot space',
      value: `${dimensions.bootLitres} litres`,
      sortOrder: 50,
    },
    {
      group: SpecificationGroup.SAFETY,
      label: 'Airbags',
      value: '6 (sample specification)',
      sortOrder: 10,
    },
    {
      group: SpecificationGroup.SAFETY,
      label: 'Braking',
      value: 'ABS with EBD (sample specification)',
      sortOrder: 20,
    },
    {
      group: SpecificationGroup.SAFETY,
      label: 'Child seat mounts',
      value: 'ISOFIX, second row (sample specification)',
      sortOrder: 30,
    },
    {
      group: SpecificationGroup.COMFORT,
      label: 'Seating capacity',
      value: `${model.slug === 'vantara-kestrel' ? 7 : 5} seats`,
      sortOrder: 10,
    },
    {
      group: SpecificationGroup.COMFORT,
      label: 'Climate control',
      value: 'Automatic, dual zone (sample specification)',
      sortOrder: 20,
    },
    {
      group: SpecificationGroup.TECHNOLOGY,
      label: 'Infotainment',
      value: '10.25-inch touchscreen (sample specification)',
      sortOrder: 10,
    },
    {
      group: SpecificationGroup.TECHNOLOGY,
      label: 'Connectivity',
      value: 'Wireless smartphone mirroring (sample specification)',
      sortOrder: 20,
    },
  );

  return specifications;
}

interface UsedCarSeed {
  slug: string;
  modelSlug: string;
  variantSlug: string;
  showroomCode: string;
  registrationYear: number;
  registrationMonth: number;
  mileageKm: number;
  ownershipCount: number;
  colourName: string;
  pricePaise: number;
  stockStatus: StockStatus;
  registrationNumberMasked: string;
  description: string;
  highlights: string[];
  inspectionScore: number;
  inspectedAt: string;
}

const usedCarSeeds: UsedCarSeed[] = [
  {
    slug: '2023-vantara-lumen-petrol-mt-lucknow',
    modelSlug: 'vantara-lumen',
    variantSlug: 'vantara-lumen-petrol-mt',
    showroomCode: 'LKO-GOMTI',
    registrationYear: 2023,
    registrationMonth: 3,
    mileageKm: 28_400,
    ownershipCount: 1,
    colourName: 'Moonstone White',
    pricePaise: 89_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 4821',
    description:
      'A single-owner fictional Lumen used as a family car. The sample inspection file records routine wear and no structural repairs. Registration details are masked.',
    highlights: [
      'Single sample owner',
      'Service history summarised in the inspection file',
      'Original paint on all panels (sample finding)',
      'Two keys included',
    ],
    inspectionScore: 91,
    inspectedAt: '2026-09-18T09:30:00.000Z',
  },
  {
    slug: '2021-vantara-meridian-diesel-automatic-lucknow',
    modelSlug: 'vantara-meridian',
    variantSlug: 'vantara-meridian-diesel-automatic',
    showroomCode: 'LKO-CENTRAL',
    registrationYear: 2021,
    registrationMonth: 11,
    mileageKm: 61_200,
    ownershipCount: 2,
    colourName: 'Midnight Blue',
    pricePaise: 124_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 1907',
    description:
      'A fictional diesel sedan with a documented service record and a recent inspection. The sample report notes normal age-related wear on the driver seat bolster.',
    highlights: [
      'Diesel automatic sample listing',
      'Documented service record',
      'Four recently replaced tyres (sample finding)',
      'No reported accident repairs',
    ],
    inspectionScore: 88,
    inspectedAt: '2026-09-22T11:00:00.000Z',
  },
  {
    slug: '2022-vantara-solace-petrol-automatic-lucknow',
    modelSlug: 'vantara-solace',
    variantSlug: 'vantara-solace-petrol-automatic',
    showroomCode: 'LKO-SGC',
    registrationYear: 2022,
    registrationMonth: 7,
    mileageKm: 34_800,
    ownershipCount: 1,
    colourName: 'Sky Blue',
    pricePaise: 62_500_000,
    stockStatus: StockStatus.RESERVED,
    registrationNumberMasked: 'UP-32 •• 7714',
    description:
      'A compact fictional hatchback reserved for a sample customer. The listing remains visible so stock status behaviour can be reviewed end to end.',
    highlights: [
      'Reserved sample listing',
      'Automatic transmission',
      'Cabin and bodywork rated good',
      'Complete sample inspection file',
    ],
    inspectionScore: 90,
    inspectedAt: '2026-09-27T15:15:00.000Z',
  },
  {
    slug: '2020-vantara-kestrel-diesel-mt-lucknow',
    modelSlug: 'vantara-kestrel',
    variantSlug: 'vantara-kestrel-diesel-mt',
    showroomCode: 'LKO-CENTRAL',
    registrationYear: 2020,
    registrationMonth: 1,
    mileageKm: 78_600,
    ownershipCount: 2,
    colourName: 'Sandstone Beige',
    pricePaise: 157_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 3345',
    description:
      'A larger fictional SUV with higher sample mileage. The inspection notes cosmetic wear consistent with age and a clean road-test result.',
    highlights: [
      'Seven-seat sample configuration',
      'Diesel manual',
      'Road test passed',
      'Cosmetic wear disclosed',
    ],
    inspectionScore: 84,
    inspectedAt: '2026-09-15T10:20:00.000Z',
  },
  {
    slug: '2024-vantara-aria-ev-long-range-lucknow',
    modelSlug: 'vantara-aria',
    variantSlug: 'vantara-aria-ev-long-range',
    showroomCode: 'LKO-SGC',
    registrationYear: 2024,
    registrationMonth: 5,
    mileageKm: 18_200,
    ownershipCount: 1,
    colourName: 'Electric Teal',
    pricePaise: 242_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 8250',
    description:
      'A recent fictional electric crossover listing. Battery health and charging checks are included in the sample inspection report. Range figures are illustrative.',
    highlights: [
      'Battery health check included (sample)',
      'Single sample owner',
      'Low sample mileage',
      'Portable charging cable present',
    ],
    inspectionScore: 94,
    inspectedAt: '2026-10-02T08:45:00.000Z',
  },
  {
    slug: '2022-vantara-lumen-diesel-mt-lucknow',
    modelSlug: 'vantara-lumen',
    variantSlug: 'vantara-lumen-diesel-mt',
    showroomCode: 'LKO-GOMTI',
    registrationYear: 2022,
    registrationMonth: 9,
    mileageKm: 44_100,
    ownershipCount: 1,
    colourName: 'Graphite Grey',
    pricePaise: 98_000_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 6093',
    description:
      'A fictional diesel crossover with a documented inspection. The sample report notes a small paint touch-up on the rear bumper.',
    highlights: [
      'Diesel manual',
      'Paint touch-up disclosed (sample)',
      'Service history summarised',
      'Two keys included',
    ],
    inspectionScore: 87,
    inspectedAt: '2026-09-29T13:40:00.000Z',
  },
  {
    slug: '2019-vantara-meridian-petrol-mt-lucknow',
    modelSlug: 'vantara-meridian',
    variantSlug: 'vantara-meridian-petrol-mt',
    showroomCode: 'LKO-CENTRAL',
    registrationYear: 2019,
    registrationMonth: 4,
    mileageKm: 71_400,
    ownershipCount: 2,
    colourName: 'Gunmetal Grey',
    pricePaise: 89_500_000,
    stockStatus: StockStatus.SOLD,
    registrationNumberMasked: 'UP-32 •• 2218',
    description:
      'A fictional older sedan retained in the sample data as a sold listing. It demonstrates that a sold vehicle is not presented as available stock.',
    highlights: [
      'Sold sample listing',
      'Documented inspection file',
      'Higher sample mileage',
      'Sold status is explicit in the API',
    ],
    inspectionScore: 80,
    inspectedAt: '2026-08-12T12:10:00.000Z',
  },
  {
    slug: '2021-vantara-solace-petrol-mt-lucknow',
    modelSlug: 'vantara-solace',
    variantSlug: 'vantara-solace-petrol-mt',
    showroomCode: 'LKO-GOMTI',
    registrationYear: 2021,
    registrationMonth: 6,
    mileageKm: 52_600,
    ownershipCount: 1,
    colourName: 'Alpine White',
    pricePaise: 51_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 5570',
    description:
      'A compact fictional hatchback in the certified used programme. The sample inspection covers mechanical, body, electrical, and documentation checks.',
    highlights: [
      'Compact city car',
      'Single sample owner',
      'Mechanical inspection passed',
      'Insurance history summarised',
    ],
    inspectionScore: 86,
    inspectedAt: '2026-09-20T16:00:00.000Z',
  },
  {
    slug: '2023-vantara-kestrel-petrol-automatic-lucknow',
    modelSlug: 'vantara-kestrel',
    variantSlug: 'vantara-kestrel-petrol-automatic',
    showroomCode: 'LKO-SGC',
    registrationYear: 2023,
    registrationMonth: 12,
    mileageKm: 23_900,
    ownershipCount: 1,
    colourName: 'Deep Forest',
    pricePaise: 212_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 9031',
    description:
      'A recent fictional petrol SUV listing with low sample mileage. The sample report records a minor kerb mark on one alloy wheel.',
    highlights: [
      'Low sample mileage',
      'Petrol automatic',
      'Minor alloy kerb mark disclosed (sample)',
      'Full inspection file attached',
    ],
    inspectionScore: 92,
    inspectedAt: '2026-10-04T09:10:00.000Z',
  },
  {
    slug: '2024-vantara-aria-ev-standard-lucknow',
    modelSlug: 'vantara-aria',
    variantSlug: 'vantara-aria-ev-standard',
    showroomCode: 'LKO-CENTRAL',
    registrationYear: 2024,
    registrationMonth: 2,
    mileageKm: 31_500,
    ownershipCount: 1,
    colourName: 'Glacier White',
    pricePaise: 189_500_000,
    stockStatus: StockStatus.AVAILABLE,
    registrationNumberMasked: 'UP-32 •• 1184',
    description:
      'A fictional standard-range electric crossover in the certified used programme. The battery check and charging test are recorded in the sample inspection.',
    highlights: [
      'Electric sample listing',
      'Battery and charging checks recorded',
      'Single sample owner',
      'Complete charging kit',
    ],
    inspectionScore: 89,
    inspectedAt: '2026-09-30T10:05:00.000Z',
  },
];

const inspectionItems: Array<{
  category: string;
  label: string;
  attention?: string;
}> = [
  {
    category: 'Bodywork',
    label: 'Structure and panel alignment',
    attention: 'A light cosmetic scuff is recorded on the rear bumper.',
  },
  {
    category: 'Paint',
    label: 'Paint condition and repaint check',
  },
  {
    category: 'Engine',
    label: 'Engine, fluids, and drivetrain',
  },
  {
    category: 'Transmission',
    label: 'Transmission operation',
  },
  {
    category: 'Brakes and suspension',
    label: 'Brakes, tyres, and suspension',
    attention: 'Front brake pads are noted for replacement within the sample estimate.',
  },
  {
    category: 'Electrical',
    label: 'Electrical and electronic systems',
  },
  {
    category: 'Interior',
    label: 'Interior and upholstery',
    attention: 'Normal age-related wear is recorded on the driver seat bolster.',
  },
  {
    category: 'Road test',
    label: 'Road test and driving behaviour',
  },
  {
    category: 'Documents',
    label: 'Registration, ownership, and service history',
  },
];

interface DemoFleetSeed {
  showroomCode: string;
  variantSlug: string;
  registrationNumber: string;
  vin: string;
}

const demoFleetSeeds: DemoFleetSeed[] = [
  // Central Lucknow
  {
    showroomCode: 'LKO-CENTRAL',
    variantSlug: 'vantara-lumen-petrol-automatic',
    registrationNumber: 'UP-32-DM-0101',
    vin: 'VIN-DM-LUM-0101',
  },
  {
    showroomCode: 'LKO-CENTRAL',
    variantSlug: 'vantara-meridian-diesel-automatic',
    registrationNumber: 'UP-32-DM-0102',
    vin: 'VIN-DM-MER-0102',
  },
  {
    showroomCode: 'LKO-CENTRAL',
    variantSlug: 'vantara-aria-ev-long-range',
    registrationNumber: 'UP-32-DM-0103',
    vin: 'VIN-DM-ARI-0103',
  },
  {
    showroomCode: 'LKO-CENTRAL',
    variantSlug: 'vantara-kestrel-diesel-automatic',
    registrationNumber: 'UP-32-DM-0104',
    vin: 'VIN-DM-KES-0104',
  },
  {
    showroomCode: 'LKO-CENTRAL',
    variantSlug: 'vantara-solace-petrol-automatic',
    registrationNumber: 'UP-32-DM-0105',
    vin: 'VIN-DM-SOL-0105',
  },

  // Gomti Nagar
  {
    showroomCode: 'LKO-GOMTI',
    variantSlug: 'vantara-lumen-petrol-mt',
    registrationNumber: 'UP-32-DM-0201',
    vin: 'VIN-DM-LUM-0201',
  },
  {
    showroomCode: 'LKO-GOMTI',
    variantSlug: 'vantara-meridian-petrol-automatic',
    registrationNumber: 'UP-32-DM-0202',
    vin: 'VIN-DM-MER-0202',
  },
  {
    showroomCode: 'LKO-GOMTI',
    variantSlug: 'vantara-aria-ev-standard',
    registrationNumber: 'UP-32-DM-0203',
    vin: 'VIN-DM-ARI-0203',
  },
  {
    showroomCode: 'LKO-GOMTI',
    variantSlug: 'vantara-kestrel-petrol-automatic',
    registrationNumber: 'UP-32-DM-0204',
    vin: 'VIN-DM-KES-0204',
  },

  // Sushant Golf City
  {
    showroomCode: 'LKO-SGC',
    variantSlug: 'vantara-lumen-diesel-mt',
    registrationNumber: 'UP-32-DM-0301',
    vin: 'VIN-DM-LUM-0301',
  },
  {
    showroomCode: 'LKO-SGC',
    variantSlug: 'vantara-meridian-petrol-mt',
    registrationNumber: 'UP-32-DM-0302',
    vin: 'VIN-DM-MER-0302',
  },
  {
    showroomCode: 'LKO-SGC',
    variantSlug: 'vantara-aria-ev-long-range-awd',
    registrationNumber: 'UP-32-DM-0303',
    vin: 'VIN-DM-ARI-0303',
  },
  {
    showroomCode: 'LKO-SGC',
    variantSlug: 'vantara-solace-turbo-petrol-mt',
    registrationNumber: 'UP-32-DM-0304',
    vin: 'VIN-DM-SOL-0304',
  },
];

async function seedDemoFleet(
  showrooms: Map<string, string>,
  variants: Map<string, { id: string }>,
) {
  let count = 0;
  for (const seed of demoFleetSeeds) {
    const showroomId = showrooms.get(seed.showroomCode);
    const variant = variants.get(seed.variantSlug);
    if (!showroomId || !variant) continue;

    await prisma.demoVehicle.upsert({
      where: {
        showroomId_registrationNumber: {
          showroomId,
          registrationNumber: seed.registrationNumber,
        },
      },
      update: {
        variantId: variant.id,
        vin: seed.vin,
        isActive: true,
      },
      create: {
        showroomId,
        variantId: variant.id,
        registrationNumber: seed.registrationNumber,
        vin: seed.vin,
        isActive: true,
      },
    });
    count++;
  }
  return count;
}

const workshopSeeds = [
  {
    code: 'WS-GOMTI',
    name: 'Gomti Nagar Service Workshop',
    address: 'Plot 14, Vibhuti Khand, Gomti Nagar, Lucknow, UP 226010',
    phone: '+91 522 2720011',
    showroomCode: 'LKO-GOMTI',
    baysCount: 6,
    dailyCapacity: 24,
    slotCapacity: 3,
  },
  {
    code: 'WS-SGC',
    name: 'Sushant Golf City Service Workshop',
    address: 'Sector B, Amar Shaheed Path, Sushant Golf City, Lucknow, UP 226030',
    phone: '+91 522 2970022',
    showroomCode: 'LKO-SGC',
    baysCount: 8,
    dailyCapacity: 32,
    slotCapacity: 4,
  },
];

async function seedWorkshops(showrooms: Map<string, string>) {
  let count = 0;
  for (const seed of workshopSeeds) {
    const showroomId = showrooms.get(seed.showroomCode);
    const workshop = await prisma.workshop.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        address: seed.address,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        timezone: 'Asia/Kolkata',
        phone: seed.phone,
        showroomId: showroomId ?? null,
        baysCount: seed.baysCount,
        dailyCapacity: seed.dailyCapacity,
        slotCapacity: seed.slotCapacity,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        address: seed.address,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        timezone: 'Asia/Kolkata',
        phone: seed.phone,
        showroomId: showroomId ?? null,
        baysCount: seed.baysCount,
        dailyCapacity: seed.dailyCapacity,
        slotCapacity: seed.slotCapacity,
        isActive: true,
      },
    });

    for (let day = 0; day <= 6; day++) {
      const isSunday = day === 0;
      await prisma.workshopOperatingHours.upsert({
        where: {
          workshopId_dayOfWeek: {
            workshopId: workshop.id,
            dayOfWeek: day,
          },
        },
        update: {
          opensAt: '08:30',
          closesAt: '18:30',
          slotDurationMinutes: 60,
          isOpen: !isSunday,
        },
        create: {
          workshopId: workshop.id,
          dayOfWeek: day,
          opensAt: '08:30',
          closesAt: '18:30',
          slotDurationMinutes: 60,
          isOpen: !isSunday,
        },
      });
    }
    count++;
  }
  return count;
}

const serviceTypeSeeds = [
  {
    code: 'PERIODIC_MAINTENANCE',
    name: 'Periodic Maintenance & Oil Service',
    description:
      'Comprehensive scheduled maintenance including synthetic engine oil change, oil & air filter replacement, fluid top-ups, and 60-point electronic health scan.',
    durationMinutes: 120,
    estimatedPricePaise: 450000,
    sortOrder: 1,
  },
  {
    code: 'EXPRESS_CARE',
    name: 'Express Care & Lube Service',
    description:
      'Rapid 60-minute pitstop service: engine oil, washer fluid top-up, tyre pressure calibration, wiper check, and exterior pressure wash.',
    durationMinutes: 60,
    estimatedPricePaise: 220000,
    sortOrder: 2,
  },
  {
    code: 'BRAKES_SUSPENSION',
    name: 'Brakes & Suspension Inspection',
    description:
      'Brake pad thickness inspection, rotor skimming check, caliper lubrication, suspension damper check, and wheel alignment assessment.',
    durationMinutes: 90,
    estimatedPricePaise: 380000,
    sortOrder: 3,
  },
  {
    code: 'BATTERY_ELECTRICAL',
    name: 'Electrical & Battery Diagnostic',
    description:
      'Complete battery state-of-charge & health analysis, starter motor & alternator load test, fuse box inspection, and ECU fault code scan.',
    durationMinutes: 60,
    estimatedPricePaise: 180000,
    sortOrder: 4,
  },
  {
    code: 'GENERAL_HEALTH_CHECK',
    name: 'Comprehensive Vehicle Safety Audit',
    description:
      'Thorough 45-point seasonal health evaluation: HVAC cooling test, brake wear, lighting, belt condition, underbody inspection, and road test report.',
    durationMinutes: 60,
    estimatedPricePaise: 120000,
    sortOrder: 5,
  },
];

async function seedServiceTypes() {
  let count = 0;
  for (const seed of serviceTypeSeeds) {
    await prisma.serviceType.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        description: seed.description,
        durationMinutes: seed.durationMinutes,
        estimatedPricePaise: seed.estimatedPricePaise,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        description: seed.description,
        durationMinutes: seed.durationMinutes,
        estimatedPricePaise: seed.estimatedPricePaise,
        sortOrder: seed.sortOrder,
        isActive: true,
      },
    });
    count++;
  }
  return count;
}

async function seedShowrooms() {
  const ids = new Map<string, string>();

  for (const seed of showroomSeeds) {
    const row = await prisma.showroom.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        timezone: 'Asia/Kolkata',
        isActive: seed.isActive,
      },
      create: {
        code: seed.code,
        name: seed.name,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        timezone: 'Asia/Kolkata',
        isActive: seed.isActive,
      },
    });

    ids.set(seed.code, row.id);
  }

  return ids;
}

async function seedCatalogue() {
  const models = new Map<string, { id: string; seed: ModelSeed; colourIds: string[] }>();
  const variants = new Map<
    string,
    { id: string; seed: VariantSeed; model: ModelSeed; colourIds: string[] }
  >();

  for (const modelSeed of modelSeeds) {
    const model = await prisma.vehicleModel.upsert({
      where: { slug: modelSeed.slug },
      update: {
        make: modelSeed.make,
        name: modelSeed.name,
        bodyType: modelSeed.bodyType,
        summary: modelSeed.summary,
        description: modelSeed.description,
        isActive: true,
      },
      create: {
        slug: modelSeed.slug,
        make: modelSeed.make,
        name: modelSeed.name,
        bodyType: modelSeed.bodyType,
        summary: modelSeed.summary,
        description: modelSeed.description,
        isActive: true,
      },
    });

    const colourIds: string[] = [];

    for (const [index, colour] of modelSeed.colours.entries()) {
      const row = await prisma.vehicleColour.upsert({
        where: { modelId_name: { modelId: model.id, name: colour.name } },
        update: {
          hexCode: colour.hexCode,
          finish: colour.finish,
          isActive: true,
          sortOrder: index,
        },
        create: {
          modelId: model.id,
          name: colour.name,
          hexCode: colour.hexCode,
          finish: colour.finish,
          isActive: true,
          sortOrder: index,
        },
      });

      colourIds.push(row.id);
    }

    for (const image of catalogueImages) {
      await prisma.vehicleImage.upsert({
        where: { modelId_sortOrder: { modelId: model.id, sortOrder: image.sortOrder } },
        update: {
          url: `/images/vehicles/${modelSeed.slug}-${image.suffix}.svg`,
          altText: `Illustrated placeholder of the fictional ${modelSeed.make} ${modelSeed.name}, ${image.caption.toLowerCase()}`,
          caption: `${modelSeed.make} ${modelSeed.name} — ${image.caption.toLowerCase()}`,
          credit: 'Aurelia Motors illustrative placeholder',
          width: 1200,
          height: 800,
          isPrimary: image.sortOrder === 0,
        },
        create: {
          modelId: model.id,
          url: `/images/vehicles/${modelSeed.slug}-${image.suffix}.svg`,
          altText: `Illustrated placeholder of the fictional ${modelSeed.make} ${modelSeed.name}, ${image.caption.toLowerCase()}`,
          caption: `${modelSeed.make} ${modelSeed.name} — ${image.caption.toLowerCase()}`,
          credit: 'Aurelia Motors illustrative placeholder',
          width: 1200,
          height: 800,
          isPrimary: image.sortOrder === 0,
          sortOrder: image.sortOrder,
        },
      });
    }

    for (const [index, variantSeed] of modelSeed.variants.entries()) {
      const variant = await prisma.vehicleVariant.upsert({
        where: { slug: variantSeed.slug },
        update: {
          modelId: model.id,
          name: variantSeed.name,
          fuelType: variantSeed.fuelType,
          transmission: variantSeed.transmission,
          engineCapacityCc: variantSeed.engineCapacityCc,
          powerBhp: variantSeed.powerBhp,
          torqueNm: variantSeed.torqueNm,
          seatingCapacity: modelSeed.slug === 'vantara-kestrel' ? 7 : 5,
          isActive: true,
          sortOrder: index,
        },
        create: {
          slug: variantSeed.slug,
          modelId: model.id,
          name: variantSeed.name,
          fuelType: variantSeed.fuelType,
          transmission: variantSeed.transmission,
          engineCapacityCc: variantSeed.engineCapacityCc,
          powerBhp: variantSeed.powerBhp,
          torqueNm: variantSeed.torqueNm,
          seatingCapacity: modelSeed.slug === 'vantara-kestrel' ? 7 : 5,
          isActive: true,
          sortOrder: index,
        },
      });

      for (const specification of buildSpecifications(variantSeed, modelSeed)) {
        await prisma.vehicleSpecification.upsert({
          where: {
            variantId_group_label: {
              variantId: variant.id,
              group: specification.group,
              label: specification.label,
            },
          },
          update: { value: specification.value, sortOrder: specification.sortOrder },
          create: {
            variantId: variant.id,
            group: specification.group,
            label: specification.label,
            value: specification.value,
            sortOrder: specification.sortOrder,
          },
        });
      }

      variants.set(variantSeed.slug, {
        id: variant.id,
        seed: variantSeed,
        model: modelSeed,
        colourIds,
      });
    }

    models.set(modelSeed.slug, { id: model.id, seed: modelSeed, colourIds });
  }

  return { models, variants };
}

async function seedPriceBooks(variants: Map<string, { id: string; seed: VariantSeed }>) {
  const publishedAt = new Date('2026-03-20T00:00:00.000Z');
  const effectiveFrom = new Date('2026-04-01T00:00:00.000Z');

  for (const showroom of showroomSeeds) {
    const priceBook = await prisma.priceBook.upsert({
      where: { code: `PB-${showroom.code}-2026` },
      update: {
        name: `${showroom.name} sample price book`,
        showroom: { connect: { code: showroom.code } },
        status: PriceBookStatus.PUBLISHED,
        isSample: true,
        effectiveFrom,
        effectiveTo: null,
        publishedAt,
        notes:
          'Fictional sample pricing for the assignment. Tax and insurance rates are configurable assumptions, not quotations.',
      },
      create: {
        code: `PB-${showroom.code}-2026`,
        name: `${showroom.name} sample price book`,
        showroom: { connect: { code: showroom.code } },
        status: PriceBookStatus.PUBLISHED,
        isSample: true,
        effectiveFrom,
        publishedAt,
        notes:
          'Fictional sample pricing for the assignment. Tax and insurance rates are configurable assumptions, not quotations.',
      },
    });

    for (const [slug, variant] of variants) {
      // Gomti Nagar does not carry the top Aria variant in this sample. The
      // API must show "price on request" rather than inventing a number.
      if (showroom.code === 'LKO-GOMTI' && slug === 'vantara-aria-ev-long-range-awd') {
        continue;
      }

      const entry = await prisma.priceEntry.upsert({
        where: {
          priceBookId_variantId: { priceBookId: priceBook.id, variantId: variant.id },
        },
        update: {
          exShowroomPaise: variant.seed.exShowroomPaise,
          priceKind: PriceKind.SAMPLE_ESTIMATE,
          notes: 'Sample ex-showroom value. Not a quotation.',
        },
        create: {
          priceBookId: priceBook.id,
          variantId: variant.id,
          exShowroomPaise: variant.seed.exShowroomPaise,
          priceKind: PriceKind.SAMPLE_ESTIMATE,
          notes: 'Sample ex-showroom value. Not a quotation.',
        },
      });

      for (const component of buildPriceComponents(showroom.code)) {
        await prisma.priceComponent.upsert({
          where: { priceEntryId_code: { priceEntryId: entry.id, code: component.code } },
          update: {
            label: component.label,
            category: component.category,
            calculation: component.calculation,
            amountPaise: component.amountPaise ?? null,
            rateBasisPoints: component.rateBasisPoints ?? null,
            isOptional: component.isOptional,
            sortOrder: component.sortOrder,
          },
          create: {
            priceEntryId: entry.id,
            code: component.code,
            label: component.label,
            category: component.category,
            calculation: component.calculation,
            amountPaise: component.amountPaise ?? null,
            rateBasisPoints: component.rateBasisPoints ?? null,
            isOptional: component.isOptional,
            sortOrder: component.sortOrder,
          },
        });
      }
    }
  }

  // A future draft proves that unpublished price books are excluded from public
  // responses. It is not used by the pricing resolver.
  await prisma.priceBook.upsert({
    where: { code: 'PB-LKO-CENTRAL-2027-DRAFT' },
    update: {
      name: 'Central Lucknow 2027 draft (not published)',
      showroom: { connect: { code: 'LKO-CENTRAL' } },
      status: PriceBookStatus.DRAFT,
      isSample: true,
      effectiveFrom: new Date('2027-01-01T00:00:00.000Z'),
      publishedAt: null,
      notes: 'Draft sample price book. Must never appear in public catalogue responses.',
    },
    create: {
      code: 'PB-LKO-CENTRAL-2027-DRAFT',
      name: 'Central Lucknow 2027 draft (not published)',
      showroom: { connect: { code: 'LKO-CENTRAL' } },
      status: PriceBookStatus.DRAFT,
      isSample: true,
      effectiveFrom: new Date('2027-01-01T00:00:00.000Z'),
      notes: 'Draft sample price book. Must never appear in public catalogue responses.',
    },
  });
}

async function seedInventory(
  showrooms: Map<string, string>,
  variants: Map<string, { id: string; seed: VariantSeed; colourIds: string[] }>,
) {
  const menu = [StockStatus.AVAILABLE, StockStatus.RESERVED, StockStatus.SOLD];
  const showroomCodes = showroomSeeds.map((showroom) => showroom.code);
  let sequence = 0;

  for (const variant of variants.values()) {
    for (let unitIndex = 0; unitIndex < 3; unitIndex += 1) {
      const showroomCode = showroomCodes[sequence % showroomCodes.length] ?? 'LKO-CENTRAL';
      const showroomId = showrooms.get(showroomCode);

      if (!showroomId) {
        throw new Error(`Missing showroom ${showroomCode} while seeding inventory.`);
      }

      const status =
        sequence % 7 === 4
          ? StockStatus.IN_TRANSIT
          : (menu[sequence % menu.length] ?? StockStatus.AVAILABLE);
      const colourId = variant.colourIds[(sequence + unitIndex) % variant.colourIds.length];
      const stockNumber = `AUR-${String(sequence + 1).padStart(4, '0')}`;

      await prisma.newVehicleInventory.upsert({
        where: { stockNumber },
        update: {
          showroomId,
          variantId: variant.id,
          colourId: colourId ?? null,
          status,
          manufactureYear: 2026,
          odometerKm: status === StockStatus.IN_TRANSIT ? 7 : 12,
        },
        create: {
          stockNumber,
          showroomId,
          variantId: variant.id,
          colourId: colourId ?? null,
          status,
          manufactureYear: 2026,
          odometerKm: status === StockStatus.IN_TRANSIT ? 7 : 12,
        },
      });

      sequence += 1;
    }
  }

  return sequence;
}

async function seedUsedCars(
  showrooms: Map<string, string>,
  models: Map<string, { id: string }>,
  variants: Map<string, { id: string }>,
) {
  for (const [index, seed] of usedCarSeeds.entries()) {
    const showroomId = showrooms.get(seed.showroomCode);
    const model = models.get(seed.modelSlug);
    const variant = variants.get(seed.variantSlug);

    if (!showroomId || !model || !variant) {
      throw new Error(`Missing relation while seeding used car ${seed.slug}.`);
    }

    const variantSeed = modelSeeds
      .flatMap((entry) => entry.variants)
      .find((entry) => entry.slug === seed.variantSlug);

    if (!variantSeed) {
      throw new Error(`Missing variant seed for ${seed.variantSlug}.`);
    }

    const usedVehicle = await prisma.usedVehicle.upsert({
      where: { slug: seed.slug },
      update: {
        modelId: model.id,
        variantId: variant.id,
        showroomId,
        make: 'Vantara',
        modelName: modelSeeds.find((entry) => entry.slug === seed.modelSlug)?.name ?? 'Vantara',
        variantName: variantSeed.name,
        registrationYear: seed.registrationYear,
        registrationMonth: seed.registrationMonth,
        mileageKm: seed.mileageKm,
        fuelType: variantSeed.fuelType,
        transmission: variantSeed.transmission,
        ownershipCount: seed.ownershipCount,
        colourName: seed.colourName,
        pricePaise: seed.pricePaise,
        priceKind: PriceKind.SAMPLE_ESTIMATE,
        stockStatus: seed.stockStatus,
        certified: true,
        registrationNumberMasked: seed.registrationNumberMasked,
        description: seed.description,
        highlights: seed.highlights,
      },
      create: {
        slug: seed.slug,
        modelId: model.id,
        variantId: variant.id,
        showroomId,
        make: 'Vantara',
        modelName: modelSeeds.find((entry) => entry.slug === seed.modelSlug)?.name ?? 'Vantara',
        variantName: variantSeed.name,
        registrationYear: seed.registrationYear,
        registrationMonth: seed.registrationMonth,
        mileageKm: seed.mileageKm,
        fuelType: variantSeed.fuelType,
        transmission: variantSeed.transmission,
        ownershipCount: seed.ownershipCount,
        colourName: seed.colourName,
        pricePaise: seed.pricePaise,
        priceKind: PriceKind.SAMPLE_ESTIMATE,
        stockStatus: seed.stockStatus,
        certified: true,
        registrationNumberMasked: seed.registrationNumberMasked,
        description: seed.description,
        highlights: seed.highlights,
      },
    });

    const inspection = await prisma.usedVehicleInspection.upsert({
      where: {
        usedVehicleId_version: { usedVehicleId: usedVehicle.id, version: 1 },
      },
      update: {
        inspectedAt: new Date(seed.inspectedAt),
        inspectorName: 'Aurelia Certified Inspection Team',
        overallScore: seed.inspectionScore,
        summary:
          'Sample inspection record created for the assignment. Findings are illustrative and do not describe a real vehicle.',
        reportReference: `AUR-CERT-2026-${String(index + 1).padStart(3, '0')}`,
        isCurrent: true,
      },
      create: {
        usedVehicleId: usedVehicle.id,
        version: 1,
        inspectedAt: new Date(seed.inspectedAt),
        inspectorName: 'Aurelia Certified Inspection Team',
        overallScore: seed.inspectionScore,
        summary:
          'Sample inspection record created for the assignment. Findings are illustrative and do not describe a real vehicle.',
        reportReference: `AUR-CERT-2026-${String(index + 1).padStart(3, '0')}`,
        isCurrent: true,
      },
    });

    for (const [itemIndex, item] of inspectionItems.entries()) {
      const hasAttention = item.attention !== undefined && itemIndex % 3 === 0;

      await prisma.usedInspectionItem.upsert({
        where: { inspectionId_label: { inspectionId: inspection.id, label: item.label } },
        update: {
          category: item.category,
          rating: hasAttention ? InspectionRating.ATTENTION : InspectionRating.PASS,
          notes: hasAttention ? (item.attention ?? null) : null,
          sortOrder: itemIndex,
        },
        create: {
          inspectionId: inspection.id,
          category: item.category,
          label: item.label,
          rating: hasAttention ? InspectionRating.ATTENTION : InspectionRating.PASS,
          notes: hasAttention ? (item.attention ?? null) : null,
          sortOrder: itemIndex,
        },
      });
    }
  }
}

interface StaffSeed {
  email: string;
  fullName: string;
  phone: string;
  role: StaffRole;
  showroomCodes?: string[];
  workshopCodes?: string[];
}

const staffSeeds: StaffSeed[] = [
  {
    email: 'admin@aureliamotors.com',
    fullName: 'Kabir Singhania',
    phone: '+91 98765 00001',
    role: StaffRole.ADMIN,
  },
  {
    email: 'sales.central@aureliamotors.com',
    fullName: 'Ananya Roy',
    phone: '+91 98765 00002',
    role: StaffRole.SALES_CONSULTANT,
    showroomCodes: ['LKO-CENTRAL'],
  },
  {
    email: 'sales.gomti@aureliamotors.com',
    fullName: 'Rohan Mehra',
    phone: '+91 98765 00003',
    role: StaffRole.SALES_CONSULTANT,
    showroomCodes: ['LKO-GOMTI'],
  },
  {
    email: 'usedcars@aureliamotors.com',
    fullName: 'Vikramaditya Joshi',
    phone: '+91 98765 00004',
    role: StaffRole.USED_CAR_STAFF,
    showroomCodes: ['LKO-GOMTI'],
  },
  {
    email: 'service.gomti@aureliamotors.com',
    fullName: 'Deepak Saxena',
    phone: '+91 98765 00005',
    role: StaffRole.SERVICE_ADVISOR,
    workshopCodes: ['WS-GOMTI'],
  },
  {
    email: 'service.sgc@aureliamotors.com',
    fullName: 'Pooja Kashyap',
    phone: '+91 98765 00006',
    role: StaffRole.SERVICE_ADVISOR,
    workshopCodes: ['WS-SGC'],
  },
];

async function seedStaffUsers(showrooms: Map<string, string>) {
  const defaultPassword = process.env.AURELIA_DEMO_PASSWORD;
  if (!defaultPassword) {
    throw new Error(
      'AURELIA_DEMO_PASSWORD environment variable must be set to seed demo staff accounts securely',
    );
  }
  const hashedPassword = await argon2.hash(defaultPassword);
  let count = 0;

  for (const seed of staffSeeds) {
    let staffUser = await prisma.staffUser.findUnique({
      where: { email: seed.email },
    });

    if (!staffUser) {
      staffUser = await prisma.staffUser.create({
        data: {
          email: seed.email,
          fullName: seed.fullName,
          phone: seed.phone,
          role: seed.role,
          passwordHash: hashedPassword,
          isActive: true,
        },
      });
    } else {
      // Idempotent: preserve existing passwordHash if staff user already exists!
      staffUser = await prisma.staffUser.update({
        where: { id: staffUser.id },
        data: {
          fullName: seed.fullName,
          phone: seed.phone,
          role: seed.role,
          isActive: true,
        },
      });
    }

    // Assign showrooms
    if (seed.showroomCodes) {
      for (const code of seed.showroomCodes) {
        const showroomId = showrooms.get(code);
        if (showroomId) {
          await prisma.staffLocationAssignment.upsert({
            where: {
              staffUserId_showroomId: {
                staffUserId: staffUser.id,
                showroomId,
              },
            },
            update: { isPrimary: true },
            create: {
              staffUserId: staffUser.id,
              showroomId,
              isPrimary: true,
            },
          });
        }
      }
    }

    // Assign workshops
    if (seed.workshopCodes) {
      for (const code of seed.workshopCodes) {
        const workshop = await prisma.workshop.findUnique({ where: { code } });
        if (workshop) {
          await prisma.staffLocationAssignment.upsert({
            where: {
              staffUserId_workshopId: {
                staffUserId: staffUser.id,
                workshopId: workshop.id,
              },
            },
            update: { isPrimary: true },
            create: {
              staffUserId: staffUser.id,
              workshopId: workshop.id,
              isPrimary: true,
            },
          });
        }
      }
    }

    count++;
  }

  return count;
}

async function main() {
  const showrooms = await seedShowrooms();
  const { models, variants } = await seedCatalogue();
  await seedPriceBooks(variants);
  const inventoryUnits = await seedInventory(showrooms, variants);
  await seedUsedCars(showrooms, models, variants);
  const demoVehiclesCount = await seedDemoFleet(showrooms, variants);
  const workshopsCount = await seedWorkshops(showrooms);
  const serviceTypesCount = await seedServiceTypes();
  const staffCount = await seedStaffUsers(showrooms);

  const [showroomCount, modelCount, variantCount, colourCount, imageCount, specCount] =
    await Promise.all([
      prisma.showroom.count(),
      prisma.vehicleModel.count(),
      prisma.vehicleVariant.count(),
      prisma.vehicleColour.count(),
      prisma.vehicleImage.count(),
      prisma.vehicleSpecification.count(),
    ]);

  const [priceBookCount, priceEntryCount, priceComponentCount] = await Promise.all([
    prisma.priceBook.count(),
    prisma.priceEntry.count(),
    prisma.priceComponent.count(),
  ]);

  const [usedVehicleCount, inspectionCount, inspectionItemCount] = await Promise.all([
    prisma.usedVehicle.count(),
    prisma.usedVehicleInspection.count(),
    prisma.usedInspectionItem.count(),
  ]);

  const statusCounts = await prisma.newVehicleInventory.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.log('Fictional catalogue sample data seeded.');
  console.log({
    showrooms: showroomCount,
    models: modelCount,
    variants: variantCount,
    colours: colourCount,
    images: imageCount,
    specifications: specCount,
    newInventoryUnits: inventoryUnits,
    newInventoryStatuses: Object.fromEntries(
      statusCounts.map((entry) => [entry.status, entry._count._all]),
    ),
    priceBooks: priceBookCount,
    priceEntries: priceEntryCount,
    priceComponents: priceComponentCount,
    usedVehicles: usedVehicleCount,
    inspections: inspectionCount,
    inspectionItems: inspectionItemCount,
    demoVehicles: demoVehiclesCount,
    workshops: workshopsCount,
    serviceTypes: serviceTypesCount,
    staffUsers: staffCount,
  });
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
