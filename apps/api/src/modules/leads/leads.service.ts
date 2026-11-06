import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import {
  type Prisma,
  LeadSource,
  LeadStatus,
  LeadType,
  PreferredContactMethod,
} from '@prisma/client';
import type {
  AddLeadNoteInput,
  CreateEnquiryInput,
  CreateEnquiryResponse,
  LeadDetail,
  LeadFilterQuery,
  LeadMetrics,
  LeadSummary,
  RecordContactActivityInput,
  StaffUserSummary,
  UpdateLeadStatusInput,
} from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import { LeadAssignmentService } from './lead-assignment.service.js';

export const DEFAULT_RESPONSE_SLA_MINUTES = 30;

export function getResponseSlaMinutes(): number {
  const configured = process.env.LEAD_RESPONSE_SLA_MINUTES;
  if (configured && !Number.isNaN(Number(configured))) {
    return Math.max(5, Number.parseInt(configured, 10));
  }
  return DEFAULT_RESPONSE_SLA_MINUTES;
}

export function generateLeadReference(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomInt(10000, 99999);
  return `LEA-${year}-${randomSuffix}`;
}

export class LeadsService {
  private readonly assignmentService: LeadAssignmentService;

  constructor(private readonly prisma: PrismaClient = defaultPrisma) {
    this.assignmentService = new LeadAssignmentService(prisma);
  }

  /**
   * Public enquiry submission with rate limiting, duplicate protection,
   * consent recording, and automatic consultant assignment.
   */
  async createPublicEnquiry(
    input: CreateEnquiryInput,
    meta?: { ipHash?: string; userAgent?: string },
  ): Promise<CreateEnquiryResponse> {
    // 1. Verify showroom exists and is active
    const showroom = await this.prisma.showroom.findUnique({
      where: { id: input.showroomId },
    });
    if (!showroom || !showroom.isActive) {
      throw new AppError(404, 'SHOWROOM_NOT_FOUND', 'Selected showroom is invalid or inactive');
    }

    // 2. Determine lead type & verify vehicle interest if specified
    let leadType: LeadType = LeadType.NEW_CAR;

    if (input.usedVehicleId) {
      leadType = LeadType.USED_CAR;
      const usedVehicle = await this.prisma.usedVehicle.findUnique({
        where: { id: input.usedVehicleId },
      });
      if (!usedVehicle) {
        throw new AppError(404, 'VEHICLE_NOT_FOUND', 'Specified certified vehicle not found');
      }
    } else if (input.modelId) {
      const model = await this.prisma.vehicleModel.findUnique({
        where: { id: input.modelId },
      });
      if (!model || !model.isActive) {
        throw new AppError(404, 'MODEL_NOT_FOUND', 'Specified vehicle model not found');
      }

      if (input.variantId) {
        const variant = await this.prisma.vehicleVariant.findUnique({
          where: { id: input.variantId },
        });
        if (!variant || !variant.isActive || variant.modelId !== model.id) {
          throw new AppError(404, 'VARIANT_NOT_FOUND', 'Specified vehicle variant not found');
        }
      }
    }

    // 3. Duplicate protection: check if an identical enquiry was submitted within the last 30 minutes
    const normalizedPhone = input.phone.replace(/[\s-]/g, '');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const duplicate = await this.prisma.lead.findFirst({
      where: {
        createdAt: { gte: thirtyMinutesAgo },
        customer: {
          OR: [{ phone: normalizedPhone }, { email: input.email.toLowerCase() }],
        },
        showroomId: input.showroomId,
        modelId: input.modelId || null,
        usedVehicleId: input.usedVehicleId || null,
      },
    });

    if (duplicate) {
      throw new AppError(
        409,
        'DUPLICATE_ENQUIRY',
        'An enquiry for this vehicle was already received recently. Our showroom team will contact you shortly.',
      );
    }

    // 4. Create or update customer record, consent, and lead inside transaction
    const leadReference = generateLeadReference();
    const startTime = performance.now();

    const createdLead = await this.prisma.$transaction(async (tx) => {
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
      } else {
        // Update contact details if customer provided updated name
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { fullName: input.fullName.trim() },
        });
      }

      // Record DPDP Act 2023 Consent Audit
      await tx.customerConsent.create({
        data: {
          customerId: customer.id,
          purpose: 'CUSTOMER_ENQUIRY',
          noticeVersion: '2026.1',
          granted: true,
          source: 'WEB_ENQUIRY',
          ipHash: meta?.ipHash,
        },
      });

      // Create Lead record
      const lead = await tx.lead.create({
        data: {
          leadReference,
          customerId: customer.id,
          type: leadType,
          modelId: input.modelId || null,
          variantId: input.variantId || null,
          usedVehicleId: input.usedVehicleId || null,
          showroomId: input.showroomId,
          source: LeadSource.WEB_ENQUIRY,
          status: LeadStatus.NEW,
          preferredContactMethod:
            (input.preferredContactMethod as PreferredContactMethod) ||
            PreferredContactMethod.PHONE,
          customerRequirements: input.customerRequirements?.trim() || null,
        },
      });

      // Create initial activity log
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          activityType: 'ENQUIRY_CREATED',
          summary: 'Web enquiry submitted by customer',
          details: input.customerRequirements?.trim() || 'Customer requested vehicle consultation',
        },
      });

      // 5. Automatic assignment
      await this.assignmentService.assignLead(lead.id, input.showroomId, leadType, tx);

      return lead;
    });

    return {
      leadReference: createdLead.leadReference,
      assignmentDurationMs: Math.round(performance.now() - startTime),
      message:
        'Thank you for your enquiry. A dedicated Aurelia Motors consultant from our showroom will contact you shortly.',
    };
  }

  /**
   * Lists leads with strict location-scoping and response SLA tracking.
   */
  async listLeads(
    staffUser: StaffUserSummary,
    query: LeadFilterQuery,
  ): Promise<{
    items: LeadSummary[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const slaMinutes = getResponseSlaMinutes();
    const now = Date.now();

    // 1. Build location & role scope
    const where: Prisma.LeadWhereInput = {};

    if (staffUser.role === 'ADMIN') {
      // Global dealership view
      if (query.showroomId) {
        where.showroomId = query.showroomId;
      }
    } else if (staffUser.role === 'SALES_CONSULTANT') {
      const showroomIds = staffUser.locations
        .map((l) => l.showroomId)
        .filter((id): id is string => Boolean(id));

      if (showroomIds.length === 0) {
        where.showroomId = { in: ['__UNASSIGNED__'] };
      } else {
        where.showroomId = { in: showroomIds };
      }
    } else if (staffUser.role === 'USED_CAR_STAFF') {
      where.type = LeadType.USED_CAR;
      const showroomIds = staffUser.locations
        .map((l) => l.showroomId)
        .filter((id): id is string => Boolean(id));
      if (showroomIds.length > 0) {
        where.showroomId = { in: showroomIds };
      }
    } else if (staffUser.role === 'SERVICE_ADVISOR') {
      where.type = LeadType.SERVICE;
    }

    // 2. Query filters
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.source && query.source !== 'ALL') {
      where.source = query.source;
    }

    if (query.assignedStaffId) {
      where.assignedStaffId = query.assignedStaffId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { leadReference: { contains: term, mode: 'insensitive' } },
        { customer: { fullName: { contains: term, mode: 'insensitive' } } },
        { customer: { phone: { contains: term } } },
        { customer: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // 3. Count & query items
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    let orderBy: Prisma.LeadOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sortBy === 'status') {
      orderBy = { status: 'asc' };
    }

    const [total, rows] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          customer: true,
          model: true,
          variant: true,
          usedVehicle: true,
          showroom: true,
          assignedStaff: true,
        },
      }),
    ]);

    const items: LeadSummary[] = rows.map((lead) => {
      const isUnresponded =
        lead.firstResponseAt == null &&
        (lead.status === LeadStatus.NEW || lead.status === LeadStatus.ASSIGNED);

      const elapsedMinutes = Math.round((now - lead.createdAt.getTime()) / 60000);
      const isOverdue = isUnresponded && elapsedMinutes > slaMinutes;

      let responseTimeMinutes: number | null = null;
      if (lead.firstResponseAt) {
        responseTimeMinutes = Math.round(
          (lead.firstResponseAt.getTime() - lead.createdAt.getTime()) / 60000,
        );
      }

      let vehicleInterest = 'General Consultation';
      if (lead.usedVehicle) {
        vehicleInterest = `${lead.usedVehicle.registrationYear} ${lead.usedVehicle.make} ${lead.usedVehicle.modelName} (Certified Pre-Owned)`;
      } else if (lead.model) {
        vehicleInterest = `${lead.model.make} ${lead.model.name}${lead.variant ? ` — ${lead.variant.name}` : ''}`;
      }

      return {
        id: lead.id,
        leadReference: lead.leadReference,
        type: lead.type as LeadSummary['type'],
        source: lead.source as LeadSummary['source'],
        status: lead.status as LeadSummary['status'],
        customerName: lead.customer.fullName,
        customerPhone: lead.customer.phone,
        customerEmail: lead.customer.email,
        vehicleInterest,
        showroomName: lead.showroom.name,
        showroomId: lead.showroomId,
        assignedStaffName: lead.assignedStaff?.fullName ?? null,
        assignedStaffId: lead.assignedStaffId,
        firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
        lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
        createdAt: lead.createdAt.toISOString(),
        isOverdue,
        responseTimeMinutes,
        consentStatus: lead.consentStatus,
      };
    });

    // If sorting by urgency, place overdue/uncontacted first
    if (query.sortBy === 'urgency') {
      items.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.firstResponseAt == null && b.firstResponseAt != null) return -1;
        if (a.firstResponseAt != null && b.firstResponseAt == null) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /**
   * Retrieves full lead details with activities, notes, and status audit trail.
   */
  async getLeadById(id: string, staffUser: StaffUserSummary): Promise<LeadDetail> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        model: true,
        variant: true,
        usedVehicle: true,
        showroom: true,
        assignedStaff: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { staffUser: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { staffUser: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { staffUser: true },
        },
      },
    });

    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead with id '${id}' not found`);
    }

    // Verify location & role authorization
    if (staffUser.role !== 'ADMIN') {
      if (staffUser.role === 'SALES_CONSULTANT') {
        const showroomIds = staffUser.locations
          .map((l) => l.showroomId)
          .filter((sid): sid is string => Boolean(sid));
        if (!showroomIds.includes(lead.showroomId)) {
          throw new AppError(
            403,
            'FORBIDDEN',
            'You do not have authorization to view leads for this showroom facility',
          );
        }
      } else if (staffUser.role === 'USED_CAR_STAFF') {
        if (lead.type !== LeadType.USED_CAR) {
          throw new AppError(
            403,
            'FORBIDDEN',
            'Used car specialists are restricted to certified vehicle leads',
          );
        }
      }
    }

    const slaMinutes = getResponseSlaMinutes();
    const now = Date.now();
    const isUnresponded =
      lead.firstResponseAt == null &&
      (lead.status === LeadStatus.NEW || lead.status === LeadStatus.ASSIGNED);
    const elapsedMinutes = Math.round((now - lead.createdAt.getTime()) / 60000);
    const isOverdue = isUnresponded && elapsedMinutes > slaMinutes;

    let responseTimeMinutes: number | null = null;
    if (lead.firstResponseAt) {
      responseTimeMinutes = Math.round(
        (lead.firstResponseAt.getTime() - lead.createdAt.getTime()) / 60000,
      );
    }

    let vehicleInterest = 'General Consultation';
    if (lead.usedVehicle) {
      vehicleInterest = `${lead.usedVehicle.registrationYear} ${lead.usedVehicle.make} ${lead.usedVehicle.modelName} (Certified Pre-Owned)`;
    } else if (lead.model) {
      vehicleInterest = `${lead.model.make} ${lead.model.name}${lead.variant ? ` — ${lead.variant.name}` : ''}`;
    }

    return {
      id: lead.id,
      leadReference: lead.leadReference,
      type: lead.type as LeadDetail['type'],
      source: lead.source as LeadDetail['source'],
      status: lead.status as LeadDetail['status'],
      customerName: lead.customer.fullName,
      customerPhone: lead.customer.phone,
      customerEmail: lead.customer.email,
      vehicleInterest,
      showroomName: lead.showroom.name,
      showroomId: lead.showroomId,
      assignedStaffName: lead.assignedStaff?.fullName ?? null,
      assignedStaffId: lead.assignedStaffId,
      firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
      lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      isOverdue,
      responseTimeMinutes,
      consentStatus: lead.consentStatus,
      preferredContactMethod: lead.preferredContactMethod as LeadDetail['preferredContactMethod'],
      customerRequirements: lead.customerRequirements,
      externalLeadId: lead.externalLeadId,
      assignedAt: lead.assignedAt?.toISOString() ?? null,
      closedAt: lead.closedAt?.toISOString() ?? null,
      lostReason: lead.lostReason,
      activities: lead.activities.map((a) => ({
        id: a.id,
        activityType: a.activityType,
        summary: a.summary,
        details: a.details,
        staffName: a.staffUser?.fullName ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      notes: lead.notes.map((n) => ({
        id: n.id,
        content: n.content,
        staffName: n.staffUser.fullName,
        createdAt: n.createdAt.toISOString(),
      })),
      statusHistory: lead.statusHistory.map((sh) => ({
        id: sh.id,
        fromStatus: sh.fromStatus as LeadDetail['status'] | null,
        toStatus: sh.toStatus as LeadDetail['status'],
        changedByName: sh.staffUser?.fullName ?? null,
        reason: sh.reason,
        createdAt: sh.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Updates lead status and preserves chronological status transition audit.
   */
  async updateLeadStatus(
    id: string,
    input: UpdateLeadStatusInput,
    staffUser: StaffUserSummary,
  ): Promise<LeadDetail> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead with id '${id}' not found`);
    }

    // Role check: verify showroom assignment
    if (staffUser.role !== 'ADMIN') {
      const showroomIds = staffUser.locations
        .map((l) => l.showroomId)
        .filter((sid): sid is string => Boolean(sid));
      if (!showroomIds.includes(lead.showroomId)) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Access denied. You cannot modify leads for other showrooms.',
        );
      }
    }

    const fromStatus = lead.status;
    const toStatus = input.status as LeadStatus;

    if (fromStatus === toStatus) {
      return this.getLeadById(id, staffUser);
    }

    const isClosed = toStatus === LeadStatus.WON || toStatus === LeadStatus.LOST;

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: {
          status: toStatus,
          closedAt: isClosed ? new Date() : null,
          lostReason: toStatus === LeadStatus.LOST ? input.reason || null : null,
        },
      });

      await tx.leadStatusHistory.create({
        data: {
          leadId: id,
          fromStatus,
          toStatus,
          changedByStaffId: staffUser.id,
          reason: input.reason,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          staffUserId: staffUser.id,
          activityType: 'STATUS_CHANGE',
          summary: `Status updated from ${fromStatus} to ${toStatus}`,
          details: input.reason || (input.notes ? `Note: ${input.notes}` : null),
        },
      });

      if (input.notes) {
        await tx.leadNote.create({
          data: {
            leadId: id,
            staffUserId: staffUser.id,
            content: input.notes,
          },
        });
      }
    });

    return this.getLeadById(id, staffUser);
  }

  /**
   * Adds an internal note to a lead.
   */
  async addLeadNote(
    id: string,
    input: AddLeadNoteInput,
    staffUser: StaffUserSummary,
  ): Promise<void> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead with id '${id}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.leadNote.create({
        data: {
          leadId: id,
          staffUserId: staffUser.id,
          content: input.content.trim(),
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          staffUserId: staffUser.id,
          activityType: 'NOTE_ADDED',
          summary: 'Internal note added',
          details: input.content.trim(),
        },
      });
    });
  }

  /**
   * Records a customer contact activity (call, email, whatsapp, meeting).
   * Crucial rule: establishing first human response time!
   */
  async recordContactActivity(
    id: string,
    input: RecordContactActivityInput,
    staffUser: StaffUserSummary,
  ): Promise<void> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead with id '${id}' not found`);
    }

    const now = new Date();
    const isFirstContact = lead.firstResponseAt == null;

    let targetStatus = lead.status;
    if (input.updateStatus) {
      targetStatus = input.updateStatus as LeadStatus;
    } else if (lead.status === LeadStatus.NEW || lead.status === LeadStatus.ASSIGNED) {
      targetStatus = LeadStatus.CONTACTED;
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update lead first response and last contact timestamps
      await tx.lead.update({
        where: { id },
        data: {
          firstResponseAt: isFirstContact ? now : undefined,
          lastContactedAt: now,
          status: targetStatus,
        },
      });

      // 2. Create activity record
      await tx.leadActivity.create({
        data: {
          leadId: id,
          staffUserId: staffUser.id,
          activityType: input.contactMethod,
          summary: input.summary.trim(),
          details: input.details?.trim() || null,
        },
      });

      // 3. Record status change if transitioned
      if (targetStatus !== lead.status) {
        await tx.leadStatusHistory.create({
          data: {
            leadId: id,
            fromStatus: lead.status,
            toStatus: targetStatus,
            changedByStaffId: staffUser.id,
            reason: `Contact made via ${input.contactMethod}: ${input.summary.trim()}`,
          },
        });
      }
    });
  }

  /**
   * Computes database metrics for lead management with location scoping.
   */
  async getLeadMetrics(staffUser: StaffUserSummary): Promise<LeadMetrics> {
    const slaMinutes = getResponseSlaMinutes();
    const now = Date.now();
    const slaThreshold = new Date(now - slaMinutes * 60 * 1000);

    const where: Prisma.LeadWhereInput = {};
    if (staffUser.role === 'SALES_CONSULTANT') {
      const showroomIds = staffUser.locations
        .map((l) => l.showroomId)
        .filter((id): id is string => Boolean(id));
      where.showroomId = showroomIds.length > 0 ? { in: showroomIds } : { in: ['__UNASSIGNED__'] };
    } else if (staffUser.role === 'USED_CAR_STAFF') {
      where.type = LeadType.USED_CAR;
    } else if (staffUser.role === 'SERVICE_ADVISOR') {
      where.type = LeadType.SERVICE;
    }

    const [
      totalLeads,
      newLeads,
      assignedLeads,
      contactedLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      unassignedLeads,
      overdueLeads,
      respondedLeads,
      showrooms,
      leadsGroupedByShowroom,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.NEW } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.ASSIGNED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.CONTACTED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.QUALIFIED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.WON } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.LOST } }),
      this.prisma.lead.count({ where: { ...where, assignedStaffId: null } }),
      this.prisma.lead.count({
        where: {
          ...where,
          status: { in: [LeadStatus.NEW, LeadStatus.ASSIGNED] },
          firstResponseAt: null,
          createdAt: { lt: slaThreshold },
        },
      }),
      this.prisma.lead.findMany({
        where: { ...where, firstResponseAt: { not: null } },
        select: { createdAt: true, firstResponseAt: true },
        take: 200,
      }),
      this.prisma.showroom.findMany({ select: { id: true, name: true } }),
      this.prisma.lead.groupBy({
        by: ['showroomId'],
        _count: { id: true },
        where,
      }),
    ]);

    // Average response time
    let averageResponseTimeMinutes: number | null = null;
    let compliantCount = 0;

    if (respondedLeads.length > 0) {
      let totalMinutes = 0;
      for (const item of respondedLeads) {
        if (item.firstResponseAt) {
          const diffMinutes = Math.round(
            (item.firstResponseAt.getTime() - item.createdAt.getTime()) / 60000,
          );
          totalMinutes += diffMinutes;
          if (diffMinutes <= slaMinutes) {
            compliantCount += 1;
          }
        }
      }
      averageResponseTimeMinutes = Math.round(totalMinutes / respondedLeads.length);
    }

    const slaComplianceRatePercent =
      respondedLeads.length > 0 ? Math.round((compliantCount / respondedLeads.length) * 100) : null;

    const leadsByShowroom: Record<string, number> = {};
    for (const sh of showrooms) {
      const match = leadsGroupedByShowroom.find((g) => g.showroomId === sh.id);
      leadsByShowroom[sh.name] = match?._count.id ?? 0;
    }

    return {
      totalLeads,
      newLeads,
      assignedLeads,
      contactedLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      overdueLeads,
      unassignedLeads,
      averageResponseTimeMinutes,
      responseSlaMinutes: slaMinutes,
      slaComplianceRatePercent,
      leadsByShowroom,
    };
  }
}
