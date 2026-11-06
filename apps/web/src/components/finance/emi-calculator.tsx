import { useState } from 'react';
import { calculateEmi, formatInrFromPaise } from '@aurelia/shared';

interface EmiCalculatorProps {
  basePricePaise: number;
  vehicleName?: string;
}

const TENURE_OPTIONS = [12, 24, 36, 48, 60, 72, 84];

export function EmiCalculator({ basePricePaise, vehicleName }: EmiCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureMonths, setTenureMonths] = useState<number>(60);

  const downPaymentPaise = Math.round(basePricePaise * (downPaymentPercent / 100));

  const emiResult = calculateEmi({
    vehiclePricePaise: basePricePaise,
    downPaymentPaise,
    annualInterestRatePercent: interestRate,
    tenureMonths,
  });

  const principalRatio =
    emiResult.totalRepaymentPaise > 0
      ? (emiResult.principalPaise / emiResult.totalRepaymentPaise) * 100
      : 100;
  const interestRatio = 100 - principalRatio;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-100 pb-5 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Aurelia Smart Finance
          </span>
          <h3 className="mt-1 font-serif text-2xl text-stone-900">EMI & Finance Calculator</h3>
          {vehicleName && (
            <p className="text-sm text-stone-600">
              Personalised reducing-balance financing estimate for the {vehicleName}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-stone-50 px-4 py-2 text-right">
          <p className="text-xs text-stone-500">Ex-Showroom Base</p>
          <p className="font-mono text-lg font-bold text-stone-900">
            {formatInrFromPaise(basePricePaise)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sliders Controls */}
        <div className="space-y-6 lg:col-span-7">
          {/* Down Payment */}
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="down-payment-range" className="font-medium text-stone-800">
                Down Payment ({downPaymentPercent}%)
              </label>
              <span className="font-mono font-semibold text-stone-900">
                {formatInrFromPaise(downPaymentPaise)}
              </span>
            </div>
            <input
              id="down-payment-range"
              type="range"
              min={10}
              max={80}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-amber-600"
            />
            <div className="mt-1 flex justify-between text-xs text-stone-600">
              <span>10% ({formatInrFromPaise(basePricePaise * 0.1)})</span>
              <span>80% ({formatInrFromPaise(basePricePaise * 0.8)})</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="interest-rate-range" className="font-medium text-stone-800">
                Annual Interest Rate (Reducing)
              </label>
              <span className="font-mono font-semibold text-amber-700">
                {interestRate.toFixed(2)}% p.a.
              </span>
            </div>
            <input
              id="interest-rate-range"
              type="range"
              min={6.5}
              max={14.0}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-amber-600"
            />
            <div className="mt-1 flex justify-between text-xs text-stone-600">
              <span>6.50% (Subsidised Tier)</span>
              <span>14.00%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <label className="text-sm font-medium text-stone-800">
              Loan Tenure ({tenureMonths} Months / {(tenureMonths / 12).toFixed(1)} Years)
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {TENURE_OPTIONS.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setTenureMonths(months)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                    tenureMonths === months
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {months / 12} Yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/70 p-6 lg:col-span-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Estimated Monthly Outflow
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
                {formatInrFromPaise(emiResult.monthlyEmiPaise)}
              </span>
              <span className="text-xs font-medium text-stone-500">/ month</span>
            </div>

            {/* Split Visualization Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-medium text-stone-600">
                <span>Principal ({principalRatio.toFixed(0)}%)</span>
                <span>Interest ({interestRatio.toFixed(0)}%)</span>
              </div>
              <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="bg-stone-800 transition-all duration-300"
                  style={{ width: `${principalRatio}%` }}
                />
                <div
                  className="bg-amber-600 transition-all duration-300"
                  style={{ width: `${interestRatio}%` }}
                />
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div className="mt-6 space-y-2.5 border-t border-stone-200 pt-4 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Principal Loan Amount:</span>
                <span className="font-mono font-medium text-stone-900">
                  {formatInrFromPaise(emiResult.principalPaise)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total Interest Payable:</span>
                <span className="font-mono font-medium text-amber-700">
                  {formatInrFromPaise(emiResult.totalInterestPaise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 font-medium text-stone-900">
                <span>Total Repayment Amount:</span>
                <span className="font-mono font-bold">
                  {formatInrFromPaise(emiResult.totalRepaymentPaise)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] leading-relaxed text-stone-600">
              * Illustrative calculation based on standard monthly reducing balance. Final terms,
              interest rate, processing fee, and sanction are subject to bank approval and credit
              evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
