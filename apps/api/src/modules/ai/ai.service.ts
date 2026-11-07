import type { PrismaClient } from '@prisma/client';
import { StaffRole, StockStatus } from '@prisma/client';
import type {
  AiLeadSummary,
  AiResponseDraft,
  AiVehicleRecommendation,
  StaffUserSummary,
} from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export const AI_PROVIDER_NAME = 'Aurelia Grounded Domain Engine';

export class AiService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  private async getScopedLead(leadId: string, staffUser: StaffUserSummary) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
        model: true,
        variant: {
          include: { specifications: true },
        },
        usedVehicle: true,
        showroom: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 5 },
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead '${leadId}' not found`);
    }

    if (staffUser.role !== StaffRole.ADMIN) {
      const allowed = staffUser.locations.some((l) => l.showroomId === lead.showroomId);
      if (!allowed) {
        throw new AppError(
          403,
          'LOCATION_FORBIDDEN',
          'You are not authorized to access leads for this showroom location',
        );
      }
    }

    return lead;
  }

  async generateLeadSummary(leadId: string, staffUser: StaffUserSummary): Promise<AiLeadSummary> {
    const lead = await this.getScopedLead(leadId, staffUser);

    const vehicleTitle = lead.variant
      ? `${lead.model?.name || ''} ${lead.variant.name}`
      : lead.usedVehicle
        ? `${lead.usedVehicle.registrationYear} ${lead.usedVehicle.make} ${lead.usedVehicle.modelName}`
        : lead.model
          ? lead.model.name
          : 'passenger vehicle';

    const reqLower = (lead.customerRequirements || '').toLowerCase();

    // Determine Urgency
    let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (
      reqLower.includes('urgent') ||
      reqLower.includes('immediate') ||
      reqLower.includes('today') ||
      reqLower.includes('ready to book') ||
      lead.status === 'ASSIGNED'
    ) {
      urgency = 'HIGH';
    } else if (reqLower.includes('just exploring') || reqLower.includes('next year')) {
      urgency = 'LOW';
    }

    // Determine Intent
    let intent = `Enquired about purchasing the ${vehicleTitle} via ${lead.source.replace(/_/g, ' ').toLowerCase()}.`;
    if (reqLower.includes('exchange') || reqLower.includes('trade')) {
      intent += ' Customer expressed interest in vehicle exchange / trade-in valuation.';
    } else if (
      reqLower.includes('finance') ||
      reqLower.includes('emi') ||
      reqLower.includes('loan')
    ) {
      intent += ' Customer requested financing and monthly EMI breakdown.';
    } else if (reqLower.includes('test drive') || reqLower.includes('test-drive')) {
      intent += ' Customer indicated interest in scheduling a priority showroom test-drive.';
    }

    const summary = `Lead ${lead.leadReference} from ${lead.customer.fullName} regarding ${vehicleTitle} at ${lead.showroom.name}. Contact preference is ${lead.preferredContactMethod.toLowerCase()}. ${
      lead.customerRequirements
        ? `Customer note: "${lead.customerRequirements}".`
        : 'No additional requirements noted.'
    }`;

    let recommendedNextStep =
      'Conduct initial phone consultation to assess timeline and invite to showroom.';
    if (urgency === 'HIGH') {
      recommendedNextStep =
        'Contact immediately via phone/WhatsApp to confirm demo vehicle availability and lock test-drive slot.';
    } else if (reqLower.includes('finance')) {
      recommendedNextStep =
        'Prepare illustrative reducing-balance EMI schedule at 7.99% and share via preferred contact method.';
    }

    return {
      leadId: lead.id,
      summary,
      intent,
      urgency,
      budgetSentiment:
        reqLower.includes('discount') || reqLower.includes('best price')
          ? 'Price-sensitive'
          : 'Value-focused',
      recommendedNextStep,
      provider: AI_PROVIDER_NAME,
      generatedAt: new Date().toISOString(),
    };
  }

  async draftFirstResponse(
    leadId: string,
    staffUser: StaffUserSummary,
    channel: 'EMAIL' | 'WHATSAPP' | 'PHONE_SCRIPT' = 'WHATSAPP',
  ): Promise<AiResponseDraft> {
    const lead = await this.getScopedLead(leadId, staffUser);

    const vehicleTitle = lead.variant
      ? `${lead.model?.name || ''} ${lead.variant.name}`
      : lead.usedVehicle
        ? `${lead.usedVehicle.registrationYear} ${lead.usedVehicle.make} ${lead.usedVehicle.modelName}`
        : lead.model?.name || 'Aurelia Motors vehicle';

    const customerFirstName = lead.customer.fullName.split(' ')[0] || lead.customer.fullName;
    const showroomName = lead.showroom.name;
    const consultantName = staffUser.fullName;

    let body = '';
    let subject: string | undefined = undefined;
    const keyPoints: string[] = [];

    if (lead.variant) {
      keyPoints.push(
        `Fuel & Transmission: ${lead.variant.fuelType} (${lead.variant.transmission})`,
      );
      if (lead.variant.powerBhp) keyPoints.push(`Engine Performance: ${lead.variant.powerBhp} BHP`);
      keyPoints.push(`Available for demonstration at ${showroomName}`);
    } else if (lead.usedVehicle) {
      keyPoints.push(`Certified 140-point inspection score: 90+/100`);
      keyPoints.push(`Odometer reading: ${lead.usedVehicle.mileageKm.toLocaleString('en-IN')} km`);
      keyPoints.push(`Current showroom price: ${formatInrFromPaise(lead.usedVehicle.pricePaise)}`);
    }

    if (channel === 'WHATSAPP') {
      body = `Namaste ${customerFirstName} ji, thank you for enquiring about the ${vehicleTitle} with Aurelia Motors (${showroomName}).\n\nI am ${consultantName}, your assigned relationship consultant. We have a demo unit available at our showroom and would be delighted to arrange a priority test-drive at your convenience.\n\nCould we connect briefly today to understand your preferred schedule and answer any questions on pricing or financing?`;
    } else if (channel === 'EMAIL') {
      subject = `Aurelia Motors: Your enquiry regarding the ${vehicleTitle}`;
      body = `Dear ${lead.customer.fullName},\n\nThank you for reaching out to Aurelia Motors, Lucknow. We have received your enquiry regarding the ${vehicleTitle}.\n\nAs your assigned consultant at our ${showroomName} showroom, I am personally at your disposal to assist with detailed on-road pricing, attractive finance plans starting at 7.99% p.a., and to schedule an exclusive test-drive.\n\nKey highlights:\n- Dedicated showroom preview at ${showroomName}\n- Transparent on-road pricing with itemised breakdown\n- Doorstep evaluation if you wish to trade in an existing car\n\nPlease let me know your preferred time to connect, or reply directly to this email.\n\nWarm regards,\n\n${consultantName}\nShowroom Consultant\nAurelia Motors — ${showroomName}\nLucknow, Uttar Pradesh`;
    } else {
      // PHONE_SCRIPT
      subject = `Call Script for ${customerFirstName}`;
      body = `1. OPENING:\n"Good morning/afternoon ${customerFirstName} ji, my name is ${consultantName} calling from Aurelia Motors, ${showroomName}. I am following up on your web enquiry regarding the ${vehicleTitle}."\n\n2. DISCOVERY:\n"I wanted to see if you had any specific questions regarding availability or variant options? Are you planning to purchase this month, and will you be trading in an existing vehicle?"\n\n3. ACTION/CLOSE:\n"We currently have the vehicle available for a test-drive at our ${showroomName} showroom. Would Saturday morning or Sunday afternoon suit you better to experience the car in person?"`;
    }

    return {
      leadId: lead.id,
      channel,
      subject,
      body,
      keyPoints,
      disclaimer:
        'This draft is generated by Aurelia AI for staff guidance and human-in-the-loop review. It has NOT been sent to the customer.',
      provider: AI_PROVIDER_NAME,
    };
  }

  async recommendVehicles(
    leadId: string,
    staffUser: StaffUserSummary,
  ): Promise<AiVehicleRecommendation> {
    const lead = await this.getScopedLead(leadId, staffUser);

    // Query real vehicles in the database
    const recommendations: Array<{
      id: string;
      type: 'NEW' | 'USED';
      title: string;
      pricePaise: number;
      matchScore: number;
      rationale: string;
      showroomName: string;
    }> = [];

    // 1. Look for new vehicle variants
    const newVariants = await this.prisma.vehicleVariant.findMany({
      where: {
        isActive: true,
        ...(lead.modelId ? { modelId: lead.modelId } : {}),
      },
      include: {
        model: true,
        priceEntries: { take: 1 },
      },
      take: 2,
    });

    for (const v of newVariants) {
      const price = v.priceEntries[0]?.exShowroomPaise || 120_000_000;
      recommendations.push({
        id: v.id,
        type: 'NEW',
        title: `${v.model.name} ${v.name} (${v.fuelType})`,
        pricePaise: price,
        matchScore: v.id === lead.variantId ? 98 : 88,
        rationale:
          v.id === lead.variantId
            ? 'Exact match for requested model and variant with active showroom inventory.'
            : `Alternative variant of ${v.model.name} offering ${v.transmission} transmission and balanced efficiency.`,
        showroomName: lead.showroom.name,
      });
    }

    // 2. Look for certified used vehicles in the same showroom
    const usedCars = await this.prisma.usedVehicle.findMany({
      where: {
        showroomId: lead.showroomId,
        stockStatus: StockStatus.AVAILABLE,
      },
      take: 2,
    });

    for (const u of usedCars) {
      recommendations.push({
        id: u.id,
        type: 'USED',
        title: `${u.registrationYear} ${u.make} ${u.modelName} ${u.variantName}`,
        pricePaise: u.pricePaise,
        matchScore: 82,
        rationale: `Certified pre-owned alternative available immediately at ${lead.showroom.name} with ${u.mileageKm.toLocaleString('en-IN')} km and 140-point certification.`,
        showroomName: lead.showroom.name,
      });
    }

    return {
      leadId: lead.id,
      recommendations: recommendations.slice(0, 3),
      provider: AI_PROVIDER_NAME,
    };
  }
}
