import type { PrismaClient } from '@prisma/client';
import { ProposalStatus, StaffRole } from '@prisma/client';
import type { StaffUserSummary } from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export interface ProposePriceInput {
  proposedPricePaise: number;
  reason: string;
}

export interface ReviewProposalInput {
  reviewNotes?: string;
}

export class UsedCarPricingService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async proposePrice(usedVehicleId: string, input: ProposePriceInput, staffUser: StaffUserSummary) {
    const vehicle = await this.prisma.usedVehicle.findUnique({
      where: { id: usedVehicleId },
    });

    if (!vehicle) {
      throw new AppError(404, 'VEHICLE_NOT_FOUND', `Used vehicle '${usedVehicleId}' not found`);
    }

    if (input.proposedPricePaise === vehicle.pricePaise) {
      throw new AppError(
        400,
        'IDENTICAL_PRICE',
        'Proposed price must be different from current vehicle price',
      );
    }

    if (input.proposedPricePaise <= 0) {
      throw new AppError(400, 'INVALID_PRICE', 'Proposed price must be greater than zero');
    }

    // Check if an existing PENDING proposal already exists
    const existingPending = await this.prisma.usedCarPriceProposal.findFirst({
      where: {
        usedVehicleId,
        status: ProposalStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new AppError(
        409,
        'PROPOSAL_ALREADY_PENDING',
        'A price proposal is already pending review for this vehicle',
      );
    }

    const proposal = await this.prisma.usedCarPriceProposal.create({
      data: {
        usedVehicleId,
        currentPricePaise: vehicle.pricePaise,
        proposedPricePaise: input.proposedPricePaise,
        reason: input.reason.trim(),
        status: ProposalStatus.PENDING,
        proposedByStaffId: staffUser.id,
      },
      include: {
        usedVehicle: true,
        proposedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    // Notify all active administrators about the proposal
    const admins = await this.prisma.staffUser.findMany({
      where: {
        role: StaffRole.ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    const formattedCurrent = formatInrFromPaise(vehicle.pricePaise);
    const formattedProposed = formatInrFromPaise(input.proposedPricePaise);

    await Promise.all(
      admins.map((admin) =>
        this.prisma.staffNotification.create({
          data: {
            staffUserId: admin.id,
            type: 'PRICE_PROPOSAL_SUBMITTED',
            title: 'New Used-Car Price Proposal',
            message: `${staffUser.fullName} proposed revising ${vehicle.registrationYear} ${vehicle.make} ${vehicle.modelName} from ${formattedCurrent} to ${formattedProposed}. Reason: "${input.reason.trim()}"`,
            linkUrl: '/staff/used-car-pricing',
          },
        }),
      ),
    );

    return proposal;
  }

  async listProposals(params?: { status?: ProposalStatus; usedVehicleId?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.usedVehicleId) where.usedVehicleId = params.usedVehicleId;

    const proposals = await this.prisma.usedCarPriceProposal.findMany({
      where,
      include: {
        usedVehicle: {
          select: {
            id: true,
            slug: true,
            make: true,
            modelName: true,
            variantName: true,
            registrationYear: true,
            pricePaise: true,
            colourName: true,
          },
        },
        proposedBy: { select: { id: true, fullName: true, role: true } },
        reviewedBy: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return proposals.map((p) => ({
      id: p.id,
      usedVehicleId: p.usedVehicleId,
      usedVehicleTitle: `${p.usedVehicle.registrationYear} ${p.usedVehicle.make} ${p.usedVehicle.modelName} ${p.usedVehicle.variantName}`,
      usedVehicleSlug: p.usedVehicle.slug,
      currentPricePaise: p.currentPricePaise,
      proposedPricePaise: p.proposedPricePaise,
      differencePaise: p.proposedPricePaise - p.currentPricePaise,
      reason: p.reason,
      status: p.status,
      proposedByStaffId: p.proposedByStaffId,
      proposedByStaffName: p.proposedBy.fullName,
      reviewedByStaffId: p.reviewedByStaffId,
      reviewedByStaffName: p.reviewedBy?.fullName || null,
      reviewNotes: p.reviewNotes,
      reviewedAt: p.reviewedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async approveProposal(
    proposalId: string,
    reviewer: StaffUserSummary,
    input?: ReviewProposalInput,
  ) {
    const proposal = await this.prisma.usedCarPriceProposal.findUnique({
      where: { id: proposalId },
      include: {
        usedVehicle: true,
        proposedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!proposal) {
      throw new AppError(404, 'PROPOSAL_NOT_FOUND', `Price proposal '${proposalId}' not found`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new AppError(
        400,
        'INVALID_STATUS',
        `Proposal is already ${proposal.status.toLowerCase()} and cannot be reviewed again`,
      );
    }

    // Separation of Duties: Proposer cannot self-approve
    if (proposal.proposedByStaffId === reviewer.id) {
      throw new AppError(
        403,
        'SELF_APPROVAL_FORBIDDEN',
        'Separation of Duties Violation: You cannot approve your own price proposal. Another administrator must review and approve it.',
      );
    }

    // Stale check: Vehicle price must still match currentPricePaise recorded in proposal
    if (proposal.usedVehicle.pricePaise !== proposal.currentPricePaise) {
      throw new AppError(
        409,
        'STALE_PROPOSAL',
        `Vehicle price has drifted from ${formatInrFromPaise(proposal.currentPricePaise)} to ${formatInrFromPaise(proposal.usedVehicle.pricePaise)} since this proposal was created`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update vehicle price
      await tx.usedVehicle.update({
        where: { id: proposal.usedVehicleId },
        data: { pricePaise: proposal.proposedPricePaise },
      });

      // 2. Mark proposal approved
      const res = await tx.usedCarPriceProposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.APPROVED,
          reviewedByStaffId: reviewer.id,
          reviewedAt: new Date(),
          reviewNotes: input?.reviewNotes?.trim() || null,
        },
        include: {
          usedVehicle: true,
          proposedBy: { select: { id: true, fullName: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      });

      // 3. Notify the proposer
      await tx.staffNotification.create({
        data: {
          staffUserId: proposal.proposedByStaffId,
          type: 'PRICE_APPROVAL',
          title: 'Price Proposal Approved',
          message: `Your price proposal for ${proposal.usedVehicle.make} ${proposal.usedVehicle.modelName} was approved by ${reviewer.fullName}. New price: ${formatInrFromPaise(proposal.proposedPricePaise)}.`,
          linkUrl: '/staff/used-car-pricing',
        },
      });

      return res;
    });

    return updated;
  }

  async rejectProposal(
    proposalId: string,
    reviewer: StaffUserSummary,
    input: { reviewNotes: string },
  ) {
    const proposal = await this.prisma.usedCarPriceProposal.findUnique({
      where: { id: proposalId },
      include: {
        usedVehicle: true,
        proposedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!proposal) {
      throw new AppError(404, 'PROPOSAL_NOT_FOUND', `Price proposal '${proposalId}' not found`);
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new AppError(
        400,
        'INVALID_STATUS',
        `Proposal is already ${proposal.status.toLowerCase()} and cannot be reviewed again`,
      );
    }

    // Separation of Duties: Proposer cannot self-reject
    if (proposal.proposedByStaffId === reviewer.id) {
      throw new AppError(
        403,
        'SELF_REVIEW_FORBIDDEN',
        'Separation of Duties Violation: You cannot reject your own price proposal.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.usedCarPriceProposal.update({
        where: { id: proposalId },
        data: {
          status: ProposalStatus.REJECTED,
          reviewedByStaffId: reviewer.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes.trim(),
        },
        include: {
          usedVehicle: true,
          proposedBy: { select: { id: true, fullName: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      });

      // Notify the proposer
      await tx.staffNotification.create({
        data: {
          staffUserId: proposal.proposedByStaffId,
          type: 'PRICE_REJECTION',
          title: 'Price Proposal Rejected',
          message: `Your price proposal for ${proposal.usedVehicle.make} ${proposal.usedVehicle.modelName} was rejected by ${reviewer.fullName}. Reason: "${input.reviewNotes.trim()}"`,
          linkUrl: '/staff/used-car-pricing',
        },
      });

      return res;
    });

    return updated;
  }
}
