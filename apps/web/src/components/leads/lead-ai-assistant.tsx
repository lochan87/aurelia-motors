import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Flame,
  MessageCircle,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type {
  AiLeadSummary,
  AiResponseDraft,
  AiVehicleRecommendation,
  LeadDetail,
} from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';
import { api } from '../../lib/api-client';

interface LeadAiAssistantProps {
  lead: LeadDetail;
  onApplyDraft?: (params: {
    channel: 'PHONE' | 'EMAIL' | 'WHATSAPP';
    summary: string;
    details: string;
  }) => void;
}

export function LeadAiAssistant({ lead, onApplyDraft }: LeadAiAssistantProps) {
  // State for AI Summary
  const [summary, setSummary] = useState<AiLeadSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // State for AI Response Draft
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'EMAIL' | 'PHONE_SCRIPT'>(
    'WHATSAPP',
  );
  const [draft, setDraft] = useState<AiResponseDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // State for Recommendations
  const [recommendations, setRecommendations] = useState<AiVehicleRecommendation | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const isExternalPortal =
    lead.source === 'PORTAL_IMPORT' || lead.consentStatus === 'EXTERNAL_PORTAL_TRANSFER';

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await api.getLeadAiSummary(lead.id);
      setSummary(data);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate AI lead summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchDraft = async (channel: 'WHATSAPP' | 'EMAIL' | 'PHONE_SCRIPT') => {
    setSelectedChannel(channel);
    setIsLoadingDraft(true);
    setDraftError(null);
    try {
      const data = await api.generateLeadResponseDraft(lead.id, channel);
      setDraft(data);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate outreach draft.');
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    setRecsError(null);
    try {
      const data = await api.getLeadVehicleRecommendations(lead.id);
      setRecommendations(data);
    } catch (err) {
      setRecsError(err instanceof Error ? err.message : 'Failed to retrieve recommendations.');
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const applyDraftToOutreach = () => {
    if (!draft || !onApplyDraft) return;
    const channelMap: Record<
      'WHATSAPP' | 'EMAIL' | 'PHONE_SCRIPT',
      'WHATSAPP' | 'EMAIL' | 'PHONE'
    > = {
      WHATSAPP: 'WHATSAPP',
      EMAIL: 'EMAIL',
      PHONE_SCRIPT: 'PHONE',
    };
    onApplyDraft({
      channel: channelMap[draft.channel],
      summary: `AI Draft Outreach (${draft.channel}) - ${lead.vehicleInterest}`,
      details:
        draft.channel === 'EMAIL' && draft.subject
          ? `Subject: ${draft.subject}\n\n${draft.body}`
          : draft.body,
    });
  };

  return (
    <div className="rounded-3xl border border-brass-300/60 bg-gradient-to-br from-ivory-50 via-white to-amber-50/20 p-6 shadow-sm">
      {/* Header */}
      <div className="border-brass-200/50 flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-brass-700 flex h-9 w-9 items-center justify-center rounded-xl bg-brass-500/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-base text-ink-950">
              Aurelia Copilot & Lead Intelligence
              <span className="text-brass-800 rounded-full bg-brass-400/20 px-2 py-0.5 text-[0.62rem] font-bold tracking-wider uppercase">
                Grounded AI
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Live showroom inventory, DPDP consent checks & tailored response drafts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-[0.68rem] font-medium text-stone-600 shadow-xs">
          <Bot className="h-3.5 w-3.5 text-stone-400" />
          <span>Human-in-the-Loop Protocol</span>
        </div>
      </div>

      {/* External Portal / DPDP Warning Notice */}
      {isExternalPortal && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <div className="font-bold text-amber-800">External Third-Party Portal Lead Notice</div>
            <p className="mt-0.5 text-[0.72rem] leading-relaxed text-amber-700">
              This lead was imported from an external aggregator portal. Explicit DPDP consent has
              not yet been verified. Staff must confirm communication channel preferences and obtain
              explicit marketing consent during first outreach.
            </p>
          </div>
        </div>
      )}

      {/* Module 1: AI Summary & Urgency */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-stone-700 uppercase">
            1. Lead Intent & Prioritization
          </h3>
          {!summary && (
            <button
              type="button"
              onClick={fetchSummary}
              disabled={isLoadingSummary}
              className="bg-brass-50 text-brass-800 hover:bg-brass-100 inline-flex items-center gap-1.5 rounded-xl border border-brass-400/40 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isLoadingSummary ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="text-brass-600 h-3.5 w-3.5" />
              )}
              <span>Analyze Lead</span>
            </button>
          )}
        </div>

        {summaryError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {summaryError}
          </div>
        )}

        {summary && (
          <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-white p-4 text-xs shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] font-semibold text-stone-500 uppercase">
                  Intent:
                </span>
                <span className="font-medium text-ink-950">{summary.intent}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] font-semibold text-stone-500 uppercase">
                  Urgency:
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${
                    summary.urgency === 'HIGH'
                      ? 'border border-red-200 bg-red-100 text-red-800'
                      : summary.urgency === 'MEDIUM'
                        ? 'border border-amber-200 bg-amber-100 text-amber-800'
                        : 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {summary.urgency === 'HIGH' && <Flame className="h-3 w-3 text-red-600" />}
                  {summary.urgency}
                </span>
              </div>
            </div>

            <p className="text-[0.78rem] leading-relaxed text-stone-700">{summary.summary}</p>

            <div className="grid grid-cols-1 gap-2 pt-1 text-[0.72rem] sm:grid-cols-2">
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-2.5">
                <span className="block text-[0.62rem] font-semibold text-stone-500 uppercase">
                  Budget Sentiment
                </span>
                <span className="mt-0.5 block font-medium text-ink-950">
                  {summary.budgetSentiment || 'Flexible / Standard Tariff'}
                </span>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-2.5">
                <span className="block text-[0.62rem] font-semibold text-stone-500 uppercase">
                  Vehicle Interest
                </span>
                <span className="mt-0.5 block font-medium text-ink-950">
                  {lead.vehicleInterest}
                </span>
              </div>
            </div>

            <div className="bg-brass-50/60 border-brass-200/50 text-brass-900 flex items-start gap-2 rounded-xl border p-2.5 text-[0.72rem]">
              <span className="text-brass-800 shrink-0 font-bold">Recommended Action:</span>
              <span>{summary.recommendedNextStep}</span>
            </div>
          </div>
        )}
      </div>

      {/* Module 2: Grounded Outreach Draft Generator */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-stone-700 uppercase">
            2. Tailored Outreach Drafts (Human-in-the-Loop)
          </h3>
        </div>

        {/* Channel Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDraft('WHATSAPP')}
            disabled={isLoadingDraft}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedChannel === 'WHATSAPP' && draft
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp Draft</span>
          </button>

          <button
            type="button"
            onClick={() => fetchDraft('EMAIL')}
            disabled={isLoadingDraft}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedChannel === 'EMAIL' && draft
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email Proposal</span>
          </button>

          <button
            type="button"
            onClick={() => fetchDraft('PHONE_SCRIPT')}
            disabled={isLoadingDraft}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedChannel === 'PHONE_SCRIPT' && draft
                ? 'bg-amber-600 text-white shadow-xs'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Phone Script</span>
          </button>
        </div>

        {draftError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {draftError}
          </div>
        )}

        {isLoadingDraft && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
            <RefreshCw className="text-brass-600 mx-auto mb-2 h-5 w-5 animate-spin" />
            <span>
              Generating tailored message draft using Lucknow showroom stock and pricing...
            </span>
          </div>
        )}

        {draft && !isLoadingDraft && (
          <div className="space-y-3 rounded-2xl border border-stone-200/90 bg-white p-4 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="font-semibold text-stone-600">
                {draft.channel === 'EMAIL'
                  ? `Subject: ${draft.subject || 'Aurelia Motors Enquiry'}`
                  : `${draft.channel} Draft`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(draft.body)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[0.68rem] font-semibold text-stone-700 hover:bg-stone-100"
                >
                  {copiedDraft ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                </button>
                {onApplyDraft && (
                  <button
                    type="button"
                    onClick={applyDraftToOutreach}
                    className="inline-flex items-center gap-1 rounded-lg bg-ink-950 px-2.5 py-1 text-[0.68rem] font-semibold text-ivory-50 shadow-xs hover:bg-ink-900"
                  >
                    <span>Insert into Outreach Logger</span>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-stone-100 bg-stone-50/80 p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-stone-800">
              {draft.body}
            </div>

            <p className="text-[0.65rem] text-stone-500 italic">
              Notice: Generated using Aurelia Copilot. Please inspect recipient details and
              customize greetings prior to dispatch.
            </p>
          </div>
        )}
      </div>

      {/* Module 3: Grounded Matching Stock Recommendations */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-stone-700 uppercase">
            3. Grounded Stock Recommendations
          </h3>
          {!recommendations && (
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={isLoadingRecs}
              className="bg-brass-50 text-brass-800 hover:bg-brass-100 inline-flex items-center gap-1.5 rounded-xl border border-brass-400/40 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isLoadingRecs ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="text-brass-600 h-3.5 w-3.5" />
              )}
              <span>Query Showroom Stock</span>
            </button>
          )}
        </div>

        {recsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {recsError}
          </div>
        )}

        {recommendations && (
          <div className="space-y-2">
            <p className="text-[0.72rem] text-stone-600">
              Generated by {recommendations.provider} — grounded on live showroom stock and tariffs.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              {recommendations.recommendations.map((veh, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-brass-700 text-[0.62rem] font-bold tracking-wider uppercase">
                        {veh.type} · {veh.showroomName}
                      </span>
                      <span className="font-mono text-xs font-bold text-ink-950">
                        {formatInrFromPaise(veh.pricePaise)}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-sm text-ink-950">{veh.title}</div>
                    <p className="mt-1.5 text-[0.68rem] leading-snug text-stone-600">
                      {veh.rationale}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 font-mono text-[0.62rem] text-stone-500">
                    <span>Match Score: {veh.matchScore}%</span>
                    <span className="font-semibold text-emerald-700">Available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
