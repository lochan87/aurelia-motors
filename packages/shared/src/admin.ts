import type { VehicleCondition } from './finance.js';

export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UsedCarPriceProposalDto {
  id: string;
  usedVehicleId: string;
  usedVehicleTitle: string;
  usedVehicleSlug: string;
  currentPricePaise: number;
  proposedPricePaise: number;
  differencePaise: number;
  reason: string;
  status: ProposalStatus;
  proposedByStaffId: string;
  proposedByStaffName: string;
  reviewedByStaffId?: string | null;
  reviewedByStaffName?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface PromotionOfferDto {
  id: string;
  title: string;
  description: string;
  badgeText?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startDate: string;
  endDate: string;
  modelId?: string | null;
  modelName?: string | null;
  showroomId?: string | null;
  showroomName?: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface HomepageBannerDto {
  id: string;
  headline: string;
  subheadline?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  startDate?: string | null;
  endDate?: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

export type TradeInStatus =
  'SUBMITTED' | 'EVALUATING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED';

export interface TradeInRequestDto {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  showroomId: string;
  showroomName: string;
  make: string;
  model: string;
  variant?: string | null;
  registrationYear: number;
  mileageKm: number;
  ownershipCount: number;
  condition: VehicleCondition;
  fuelType?: string | null;
  transmission?: string | null;
  estimatedValuationMinPaise: number;
  estimatedValuationMaxPaise: number;
  offeredValuationPaise?: number | null;
  status: TradeInStatus;
  customerNotes?: string | null;
  staffNotes?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'PRICE_APPROVAL'
  | 'PRICE_REJECTION'
  | 'PRICE_PROPOSAL_SUBMITTED'
  | 'TRADE_IN_ASSIGNED'
  | 'NEW_LEAD'
  | 'SYSTEM';

export interface StaffNotificationDto {
  id: string;
  staffUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface AiLeadSummary {
  leadId: string;
  summary: string;
  intent: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  budgetSentiment?: string;
  recommendedNextStep: string;
  provider: string;
  generatedAt: string;
}

export interface AiResponseDraft {
  leadId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'PHONE_SCRIPT';
  subject?: string;
  body: string;
  keyPoints: string[];
  disclaimer: string;
  provider: string;
}

export interface AiVehicleRecommendationItem {
  id: string;
  type: 'NEW' | 'USED';
  title: string;
  pricePaise: number;
  matchScore: number;
  rationale: string;
  showroomName: string;
}

export interface AiVehicleRecommendation {
  leadId: string;
  recommendations: AiVehicleRecommendationItem[];
  provider: string;
}
