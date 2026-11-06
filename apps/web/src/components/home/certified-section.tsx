import { Check } from 'lucide-react';

import { Container } from '../ui/container';

const assurances = [
  'A published inspection report with every listing.',
  'Photographs of the actual car, inside and out.',
  'Ownership, service, and insurance history in one file.',
  'A line-by-line price and a real trade-in conversation.',
];

const inspectionRows = [
  {
    title: 'Mechanical & electrical',
    body: 'Engine, transmission, brakes, suspension, and electronics.',
  },
  {
    title: 'Body & interior',
    body: 'Structure, paint, cabin condition, and equipment checks.',
  },
  {
    title: 'Road test',
    body: 'How it drives, not merely how it photographs.',
  },
  {
    title: 'Documents',
    body: 'Registration, ownership, insurance, and service history.',
  },
];

export function CertifiedSection() {
  return (
    <section id="certified" className="scroll-mt-24 bg-ivory-100 py-24 lg:py-32">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
          <div>
            <p className="flex items-center gap-3 text-[0.62rem] font-semibold tracking-[0.26em] text-stone-600 uppercase">
              <span className="text-brass-500">03</span>
              <span className="h-px w-7 bg-brass-500/60" aria-hidden="true" />
              Certified pre-owned
            </p>
            <h2 className="mt-8 max-w-xl text-4xl leading-[1.02] text-balance text-ink-950 sm:text-5xl lg:text-6xl">
              Used, with <em className="text-brass-500 italic">nothing left unsaid.</em>
            </h2>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              A used car is a set of facts before it is a feeling. Every certified listing is built
              to show you those facts first — the inspection, the photographs, the history, and the
              full price.
            </p>

            <ul className="mt-10 max-w-xl">
              {assurances.map((assurance) => (
                <li
                  key={assurance}
                  className="flex items-start gap-4 border-t border-ink-950/10 py-5 last:border-b"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brass-500/40 text-brass-500">
                    <Check aria-hidden="true" className="h-3 w-3" />
                  </span>
                  <span className="text-sm leading-6 text-ink-900">{assurance}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="relative self-start lg:mt-12">
            <div className="border border-ink-950/10 bg-ivory-50 p-7 shadow-[0_30px_80px_-40px_rgba(7,10,9,0.35)] sm:p-9">
              <div className="flex items-start justify-between gap-6 border-b border-ink-950/10 pb-6">
                <div>
                  <p className="text-[0.58rem] font-semibold tracking-[0.24em] text-brass-500 uppercase">
                    The inspection file
                  </p>
                  <p className="mt-2 font-display text-2xl text-ink-950">Every certified car.</p>
                </div>
                <p className="text-right text-[0.55rem] leading-5 font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Aurelia
                  <br />
                  Certified
                </p>
              </div>

              <div>
                {inspectionRows.map((row, index) => (
                  <div key={row.title} className="border-b border-ink-950/10 py-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg text-ink-950">{row.title}</h3>
                      <span className="text-[0.55rem] font-semibold tracking-[0.18em] text-stone-500">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-stone-600">{row.body}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-[0.6rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                Attached to every certified listing.
              </p>
            </div>

            <div className="absolute -top-7 -right-4 hidden h-24 w-24 rotate-6 flex-col items-center justify-center rounded-full border border-brass-500/40 bg-ivory-50/90 text-center text-[0.55rem] font-semibold tracking-[0.16em] text-brass-500 uppercase sm:flex">
              Aurelia
              <span className="my-1 h-px w-6 bg-brass-500/40" aria-hidden="true" />
              Certified
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
