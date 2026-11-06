import { AlertTriangle, CheckCircle, FileCheck, ShieldCheck, XCircle } from 'lucide-react';

import type {
  InspectionRating,
  UsedInspectionItemSummary,
  UsedInspectionReport,
} from '@aurelia/shared';

interface InspectionReportViewProps {
  report: UsedInspectionReport;
}

function RatingBadge({ rating }: { rating: InspectionRating }) {
  if (rating === 'PASS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-wider text-emerald-800 uppercase">
        <CheckCircle className="h-3 w-3 text-emerald-600" />
        Pass
      </span>
    );
  }

  if (rating === 'ATTENTION') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-wider text-amber-800 uppercase">
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        Attention
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-wider text-red-800 uppercase">
      <XCircle className="h-3 w-3 text-red-600" />
      Fail
    </span>
  );
}

export function InspectionReportView({ report }: InspectionReportViewProps) {
  // Group inspection items by category
  const categories = report.items.reduce<Record<string, UsedInspectionItemSummary[]>>(
    (acc, item) => {
      const list = acc[item.category] ?? [];
      list.push(item);
      acc[item.category] = list;
      return acc;
    },
    {},
  );

  const formattedDate = new Date(report.inspectedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 sm:p-8">
      {/* Score Banner */}
      <div className="flex flex-col justify-between gap-6 border-b border-ink-950/10 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brass-500 px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-wider text-ivory-50 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Aurelia Certified
            </span>
            <span className="font-mono text-[0.62rem] font-medium text-stone-500">
              Ref: {report.reportReference}
            </span>
          </div>

          <h3 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
            Technical Inspection Audit
          </h3>

          <p className="mt-1 text-xs text-stone-600">
            Inspected by <strong className="text-ink-950">{report.inspectorName}</strong> on{' '}
            {formattedDate}
          </p>
        </div>

        {/* Score Gauge */}
        <div className="flex items-center gap-4 border border-ink-950/10 bg-ivory-100 p-4 sm:p-5">
          <FileCheck className="h-8 w-8 text-brass-500" />
          <div>
            <span className="block text-[0.55rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
              Overall Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-ink-950">
                {report.overallScore}
              </span>
              <span className="text-xs font-semibold text-stone-500">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Note */}
      <div className="my-6 rounded border border-ink-950/10 bg-sand-200/30 p-4 text-xs leading-6 text-stone-700">
        <strong className="text-ink-950">Auditor Summary:</strong> {report.summary}
      </div>

      {/* Category Breakdown */}
      <div className="flex flex-col gap-8">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="overflow-hidden border border-ink-950/10 bg-ivory-100/30">
            <div className="border-b border-ink-950/10 bg-ivory-100/70 px-5 py-3">
              <h4 className="font-display text-base text-ink-950 sm:text-lg">{category}</h4>
            </div>

            <div className="divide-y divide-ink-950/10 px-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="text-xs font-medium text-ink-950 sm:text-sm">
                      {item.label}
                    </span>
                    {item.notes && (
                      <p className="mt-1 text-[0.68rem] text-amber-800">
                        <strong className="font-semibold">Note:</strong> {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 self-start sm:self-auto">
                    <RatingBadge rating={item.rating} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
