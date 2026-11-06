import type { PrismaClient, VehicleCondition } from '@prisma/client';
import {
  LeadSource,
  LeadStatus,
  LeadType,
  PreferredContactMethod,
  StaffRole,
  TradeInStatus,
} from '@prisma/client';
import type { StaffUserSummary } from '@aurelia/shared';
import { calculateTradeInEstimate, formatInrFromPaise } from '@aurelia/shared';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export interface TradeInEstimateInput {
  make: string;
  model: string;
  registrationYear: number;
  mileageKm: number;
  condition: VehicleCondition;
  ownershipCount?: number;
}

export interface CreateTradeInInput {
  fullName: string;
  phone: string;
  email: string;
  showroomId: string;
  make: string;
  model: string;
  variant?: string;
  registrationYear: number;
  mileageKm: number;
  ownershipCount?: number;
  condition: VehicleCondition;
  fuelType?: string;
  transmission?: string;
  customerNotes?: string;
  privacyConsent: boolean;
}

export interface UpdateTradeInInput {
  status?: TradeInStatus;
  offeredValuationPaise?: number;
  staffNotes?: string;
}

function generateTradeInReference(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `TRD-2026-${random}`;
}

function generateLeadReference(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ENQ-2026-${random}`;
}

export class TradeInsService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  getEstimatedBasePricePaise(make: string, model: string): number {
    const combined = `${make} ${model}`.toLowerCase();
    if (combined.includes('lumen')) return 115_000_000; // ~11.5L
    if (combined.includes('solis')) return 160_000_000; // ~16L
    if (combined.includes('e-pulse') || combined.includes('epulse')) return 220_000_000; // ~22L
    if (combined.includes('aethel')) return 320_000_000; // ~32L
    if (combined.includes('city') || combined.includes('verna')) return 140_000_000;
    if (combined.includes('creta') || combined.includes('seltos')) return 170_000_000;
    if (combined.includes('swift') || combined.includes('i20')) return 85_000_000;
    if (combined.includes('innova') || combined.includes('fortuner')) return 280_000_000;
    return 100_000_000; // Default 10 Lakhs in paise
  }

  calculateEstimate(input: TradeInEstimateInput) {
    const basePrice = this.getEstimatedBasePricePaise(input.make, input.model);
    return calculateTradeInEstimate({
      baseReferencePricePaise: basePrice,
      registrationYear: input.registrationYear,
      currentYear: 2026,
      mileageKm: input.mileageKm,
      condition: input.condition,
      ownershipCount: input.ownershipCount ?? 1,
    });
  }

  async createTradeInRequest(input: CreateTradeInInput, meta?: { ipHash?: string }) {
    if (!input.privacyConsent) {
      throw new AppError(
        400,
        'CONSENT_REQUIRED',
        'Customer privacy consent is required under DPDP Act 2023',
      );
    }

    const showroom = await this.prisma.showroom.findUnique({
      where: { id: input.showroomId },
    });
    if (!showroom || !showroom.isActive) {
      throw new AppError(404, 'SHOWROOM_NOT_FOUND', 'Specified showroom not found');
    }

    const estimate = this.calculateEstimate({
      make: input.make,
      model: input.model,
      registrationYear: input.registrationYear,
      mileageKm: input.mileageKm,
      condition: input.condition,
      ownershipCount: input.ownershipCount ?? 1,
    });

    const normalizedPhone = input.phone.replace(/[\s-]/g, '');
    const reference = generateTradeInReference();

    const tradeIn = await this.prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = await tx.customer.findFirst({
        where: {
          OR: [{ phone: normalizedPhone }, { email: input.email.toLowerCase() }],
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            fullName: input.fullName.trim(),
            phone: normalizedPhone,
            email: input.email.toLowerCase(),
          },
        });
      }

      // Record DPDP Consent
      await tx.customerConsent.create({
        data: {
          customerId: customer.id,
          purpose: 'TRADE_IN_VALUATION',
          noticeVersion: '2026.1',
          granted: true,
          verificationStatus: 'EXPLICIT_DIRECT',
          source: 'TRADE_IN_PORTAL',
          ipHash: meta?.ipHash,
        },
      });

      // Find available showroom used car staff or sales consultant
      const eligibleStaff = await tx.staffUser.findMany({
        where: {
          isActive: true,
          role: { in: [StaffRole.USED_CAR_STAFF, StaffRole.SALES_CONSULTANT] },
          locationAssignments: {
            some: { showroomId: input.showroomId },
          },
        },
      });

      // Prefer USED_CAR_STAFF if available
      const usedStaff = eligibleStaff.find((s) => s.role === StaffRole.USED_CAR_STAFF);
      const chosenStaff = usedStaff || eligibleStaff[0];

      // Create Trade-In Request
      const created = await tx.tradeInRequest.create({
        data: {
          reference,
          customerId: customer.id,
          showroomId: input.showroomId,
          make: input.make.trim(),
          model: input.model.trim(),
          variant: input.variant?.trim() || null,
          registrationYear: input.registrationYear,
          mileageKm: input.mileageKm,
          ownershipCount: input.ownershipCount ?? 1,
          condition: input.condition,
          fuelType: input.fuelType?.trim() || null,
          transmission: input.transmission?.trim() || null,
          estimatedValuationMinPaise: estimate.estimatedValuationMinPaise,
          estimatedValuationMaxPaise: estimate.estimatedValuationMaxPaise,
          status: TradeInStatus.SUBMITTED,
          customerNotes: input.customerNotes?.trim() || null,
          assignedStaffId: chosenStaff?.id || null,
        },
        include: {
          customer: true,
          showroom: true,
          assignedStaff: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Also create a Lead record in CRM so staff sees it in their unified leads inbox
      const lead = await tx.lead.create({
        data: {
          leadReference: generateLeadReference(),
          customerId: customer.id,
          type: LeadType.USED_CAR,
          showroomId: input.showroomId,
          source: LeadSource.WEB_ENQUIRY,
          status: chosenStaff ? LeadStatus.ASSIGNED : LeadStatus.NEW,
          assignedStaffId: chosenStaff?.id || null,
          assignedAt: chosenStaff ? new Date() : null,
          preferredContactMethod: PreferredContactMethod.PHONE,
          customerRequirements: `Trade-in enquiry for ${input.registrationYear} ${input.make} ${input.model} (${input.mileageKm} km, ${input.condition} condition). Estimated band: ${formatInrFromPaise(estimate.estimatedValuationMinPaise)} - ${formatInrFromPaise(estimate.estimatedValuationMaxPaise)}.`,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          staffUserId: chosenStaff?.id || null,
          activityType: 'TRADE_IN_SUBMISSION',
          summary: 'Trade-in valuation request submitted',
          details: `Ref: ${reference}. Vehicle: ${input.registrationYear} ${input.make} ${input.model}.`,
        },
      });

      // Create notification for assigned staff
      if (chosenStaff) {
        await tx.staffNotification.create({
          data: {
            staffUserId: chosenStaff.id,
            type: 'TRADE_IN_ASSIGNED',
            title: 'New Trade-In Request Assigned',
            message: `New trade-in valuation assigned: ${input.registrationYear} ${input.make} ${input.model} (${formatInrFromPaise(estimate.estimatedValuationMinPaise)} - ${formatInrFromPaise(estimate.estimatedValuationMaxPaise)}) at ${showroom.name}.`,
            linkUrl: `/staff/trade-ins`,
          },
        });
      }

      return created;
    });

    return {
      reference: tradeIn.reference,
      estimatedValuationMinPaise: tradeIn.estimatedValuationMinPaise,
      estimatedValuationMaxPaise: tradeIn.estimatedValuationMaxPaise,
      disclaimer: estimate.disclaimer,
      message:
        'Your trade-in valuation request has been received. Our showroom team will evaluate your vehicle and contact you shortly.',
    };
  }

  async listTradeIns(staffUser: StaffUserSummary, params?: { status?: TradeInStatus }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;

    // Location scoping for non-admins
    if (staffUser.role !== StaffRole.ADMIN) {
      const allowedShowroomIds = staffUser.locations
        .map((l) => l.showroomId)
        .filter((id): id is string => Boolean(id));
      where.showroomId = { in: allowedShowroomIds };
    }

    const items = await this.prisma.tradeInRequest.findMany({
      where,
      include: {
        customer: true,
        showroom: true,
        assignedStaff: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((t) => ({
      id: t.id,
      reference: t.reference,
      customerId: t.customerId,
      customerName: t.customer.fullName,
      customerPhone: t.customer.phone,
      customerEmail: t.customer.email,
      showroomId: t.showroomId,
      showroomName: t.showroom.name,
      make: t.make,
      model: t.model,
      variant: t.variant,
      registrationYear: t.registrationYear,
      mileageKm: t.mileageKm,
      ownershipCount: t.ownershipCount,
      condition: t.condition,
      fuelType: t.fuelType,
      transmission: t.transmission,
      estimatedValuationMinPaise: t.estimatedValuationMinPaise,
      estimatedValuationMaxPaise: t.estimatedValuationMaxPaise,
      offeredValuationPaise: t.offeredValuationPaise,
      status: t.status,
      customerNotes: t.customerNotes,
      staffNotes: t.staffNotes,
      assignedStaffId: t.assignedStaffId,
      assignedStaffName: t.assignedStaff?.fullName || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  async getTradeInById(id: string, staffUser: StaffUserSummary) {
    const item = await this.prisma.tradeInRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        showroom: true,
        assignedStaff: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (!item) {
      throw new AppError(404, 'NOT_FOUND', `Trade-in request '${id}' not found`);
    }

    if (staffUser.role !== StaffRole.ADMIN) {
      const allowed = staffUser.locations.some((l) => l.showroomId === item.showroomId);
      if (!allowed) {
        throw new AppError(
          403,
          'LOCATION_FORBIDDEN',
          'You are not authorized to view trade-ins for this showroom location',
        );
      }
    }

    return {
      id: item.id,
      reference: item.reference,
      customerId: item.customerId,
      customerName: item.customer.fullName,
      customerPhone: item.customer.phone,
      customerEmail: item.customer.email,
      showroomId: item.showroomId,
      showroomName: item.showroom.name,
      make: item.make,
      model: item.model,
      variant: item.variant,
      registrationYear: item.registrationYear,
      mileageKm: item.mileageKm,
      ownershipCount: item.ownershipCount,
      condition: item.condition,
      fuelType: item.fuelType,
      transmission: item.transmission,
      estimatedValuationMinPaise: item.estimatedValuationMinPaise,
      estimatedValuationMaxPaise: item.estimatedValuationMaxPaise,
      offeredValuationPaise: item.offeredValuationPaise,
      status: item.status,
      customerNotes: item.customerNotes,
      staffNotes: item.staffNotes,
      assignedStaffId: item.assignedStaffId,
      assignedStaffName: item.assignedStaff?.fullName || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async updateTradeIn(id: string, input: UpdateTradeInInput, staffUser: StaffUserSummary) {
    await this.getTradeInById(id, staffUser);

    return this.prisma.tradeInRequest.update({
      where: { id },
      data: {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.offeredValuationPaise !== undefined && {
          offeredValuationPaise: input.offeredValuationPaise,
        }),
        ...(input.staffNotes !== undefined && { staffNotes: input.staffNotes.trim() }),
      },
      include: {
        customer: true,
        showroom: true,
        assignedStaff: { select: { id: true, fullName: true, role: true } },
      },
    });
  }
}
