import type { PrismaClient } from '@prisma/client';
import { LeadStatus, LeadType, StaffRole } from '@prisma/client';
import type { StaffUserSummary } from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface AssignmentResult {
  assignedStaffId: string | null;
  routingReason: string;
}

export class LeadAssignmentService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  /**
   * Evaluates showroom, role, and current active lead workloads to deterministically
   * assign an enquiry to the optimal active consultant.
   */
  async determineAssignment(
    showroomId: string,
    leadType: LeadType,
    client: PrismaClient | PrismaTx = this.prisma,
  ): Promise<AssignmentResult> {
    // 1. Determine target role
    let targetRoles: StaffRole[] = [StaffRole.SALES_CONSULTANT];
    if (leadType === LeadType.USED_CAR) {
      targetRoles = [StaffRole.USED_CAR_STAFF, StaffRole.SALES_CONSULTANT];
    }

    // 2. Find eligible active staff assigned to this showroom
    const eligibleStaff = await client.staffUser.findMany({
      where: {
        isActive: true,
        role: { in: targetRoles },
        locationAssignments: {
          some: { showroomId },
        },
      },
      include: {
        assignedLeads: {
          where: {
            status: {
              in: [
                LeadStatus.NEW,
                LeadStatus.ASSIGNED,
                LeadStatus.CONTACTED,
                LeadStatus.QUALIFIED,
                LeadStatus.NEGOTIATING,
              ],
            },
          },
          select: { id: true, assignedAt: true },
        },
      },
    });

    if (eligibleStaff.length === 0) {
      return {
        assignedStaffId: null,
        routingReason: `No active staff with role [${targetRoles.join(', ')}] currently assigned to showroom '${showroomId}'`,
      };
    }

    // Prioritize dedicated USED_CAR_STAFF for used car leads if available
    let candidates = eligibleStaff;
    if (leadType === LeadType.USED_CAR) {
      const dedicatedUsedStaff = eligibleStaff.filter((s) => s.role === StaffRole.USED_CAR_STAFF);
      if (dedicatedUsedStaff.length > 0) {
        candidates = dedicatedUsedStaff;
      }
    }

    // 3. Workload balancing: pick consultant with least active leads; break ties by oldest last assignment
    candidates.sort((a, b) => {
      const activeCountDiff = a.assignedLeads.length - b.assignedLeads.length;
      if (activeCountDiff !== 0) {
        return activeCountDiff;
      }

      // Tie-breaker: least recently assigned (or never assigned)
      const lastAssignedA = a.assignedLeads
        .map((l) => l.assignedAt?.getTime() ?? 0)
        .reduce((max, t) => Math.max(max, t), 0);
      const lastAssignedB = b.assignedLeads
        .map((l) => l.assignedAt?.getTime() ?? 0)
        .reduce((max, t) => Math.max(max, t), 0);

      return lastAssignedA - lastAssignedB;
    });

    const chosen = candidates[0];
    if (!chosen) {
      return {
        assignedStaffId: null,
        routingReason: `No candidate available for showroom '${showroomId}'`,
      };
    }

    return {
      assignedStaffId: chosen.id,
      routingReason: `Assigned to ${chosen.fullName} (${chosen.role}) via workload balancing (${chosen.assignedLeads.length} active leads)`,
    };
  }

  /**
   * Applies the determined assignment to the lead inside a transaction.
   */
  async assignLead(
    leadId: string,
    showroomId: string,
    leadType: LeadType,
    client: PrismaClient | PrismaTx = this.prisma,
  ): Promise<AssignmentResult> {
    const { assignedStaffId, routingReason } = await this.determineAssignment(
      showroomId,
      leadType,
      client,
    );

    if (assignedStaffId) {
      await client.lead.update({
        where: { id: leadId },
        data: {
          assignedStaffId,
          assignedAt: new Date(),
          status: LeadStatus.ASSIGNED,
        },
      });

      await client.leadActivity.create({
        data: {
          leadId,
          staffUserId: assignedStaffId,
          activityType: 'ASSIGNMENT',
          summary: 'Lead automatically routed and assigned',
          details: routingReason,
        },
      });

      await client.leadStatusHistory.create({
        data: {
          leadId,
          fromStatus: LeadStatus.NEW,
          toStatus: LeadStatus.ASSIGNED,
          changedByStaffId: assignedStaffId,
          reason: routingReason,
        },
      });
    } else {
      await client.leadActivity.create({
        data: {
          leadId,
          activityType: 'ROUTING_UNASSIGNED',
          summary: 'Lead remained unassigned in showroom queue',
          details: routingReason,
        },
      });
    }

    return { assignedStaffId, routingReason };
  }

  /**
   * Reassigns a lead to another eligible staff user.
   */
  async reassignLead(
    leadId: string,
    targetStaffId: string,
    actor: StaffUserSummary,
    reason?: string,
  ): Promise<void> {
    // Only ADMIN or authorized staff can reassign
    if (actor.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only administrators are authorized to reassign leads');
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedStaff: true },
    });

    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead with id '${leadId}' not found`);
    }

    const targetStaff = await this.prisma.staffUser.findUnique({
      where: { id: targetStaffId },
      include: {
        locationAssignments: true,
      },
    });

    if (!targetStaff) {
      throw new AppError(404, 'STAFF_NOT_FOUND', `Target staff user '${targetStaffId}' not found`);
    }

    if (!targetStaff.isActive) {
      throw new AppError(
        400,
        'INACTIVE_STAFF',
        'Cannot reassign lead to a deactivated staff member',
      );
    }

    // Verify staff has appropriate role
    if (
      targetStaff.role !== StaffRole.SALES_CONSULTANT &&
      targetStaff.role !== StaffRole.USED_CAR_STAFF &&
      targetStaff.role !== StaffRole.ADMIN
    ) {
      throw new AppError(
        400,
        'INVALID_ROLE',
        `Role ${targetStaff.role} is not eligible for lead handling`,
      );
    }

    // Verify staff has location assignment matching the lead's showroom (Admins are globally permitted)
    if (targetStaff.role !== StaffRole.ADMIN) {
      const hasShowroom = targetStaff.locationAssignments.some(
        (loc) => loc.showroomId === lead.showroomId,
      );
      if (!hasShowroom) {
        throw new AppError(
          400,
          'LOCATION_MISMATCH',
          `Staff member is not assigned to showroom '${lead.showroomId}'`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: leadId },
        data: {
          assignedStaffId: targetStaff.id,
          assignedAt: new Date(),
          status: lead.status === LeadStatus.NEW ? LeadStatus.ASSIGNED : lead.status,
        },
      });

      const previousName = lead.assignedStaff?.fullName ?? 'Unassigned';
      const summary = `Lead reassigned from ${previousName} to ${targetStaff.fullName}`;

      await tx.leadActivity.create({
        data: {
          leadId,
          staffUserId: actor.id,
          activityType: 'REASSIGNMENT',
          summary,
          details: reason || 'Manual reassignment by administrator',
        },
      });

      if (lead.status === LeadStatus.NEW) {
        await tx.leadStatusHistory.create({
          data: {
            leadId,
            fromStatus: LeadStatus.NEW,
            toStatus: LeadStatus.ASSIGNED,
            changedByStaffId: actor.id,
            reason: reason || 'Reassigned from unassigned queue',
          },
        });
      }
    });
  }
}
