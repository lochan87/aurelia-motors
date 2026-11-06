import { Container } from '../ui/container';
import { SectionHeader } from '../ui/section-header';

const showrooms = [
  {
    number: '01',
    name: 'Central Lucknow',
    focus: 'New cars · Test drives · Delivery',
    description:
      'The flagship: new-car discovery, showroom handovers, and the sales desk that stays with you after delivery.',
    detail: 'Sales · Handover',
  },
  {
    number: '02',
    name: 'Gomti Nagar',
    focus: 'Certified pre-owned · Trade-in',
    description:
      'The used-car house: inspection files, fair valuations, and a calmer way to change cars.',
    detail: 'Certified · Trade-in',
  },
  {
    number: '03',
    name: 'Sushant Golf City',
    focus: 'New cars · Ownership studio',
    description:
      'A smaller, quieter showroom for focused appointments and conversations about the years after the keys.',
    detail: 'Sales · Ownership',
  },
];

export function ShowroomsSection() {
  return (
    <section id="showrooms" className="scroll-mt-24 bg-forest-950 py-24 text-ivory-50 lg:py-32">
      <Container>
        <SectionHeader
          index="02"
          eyebrow="The houses"
          tone="dark"
          title={
            <>
              Three showrooms. Two workshops. <em className="text-brass-300 italic">One pace.</em>
            </>
          }
          description="A presence across Lucknow, planned around how people actually buy and care for their cars — not how a spreadsheet says they should."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {showrooms.map((showroom) => (
            <article
              key={showroom.number}
              className="flex min-h-[21rem] flex-col border border-ivory-50/12 bg-forest-900/45 p-7 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <p className="text-[0.6rem] font-semibold tracking-[0.24em] text-ivory-50/60 uppercase">
                  Showroom {showroom.number}
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-brass-300" aria-hidden="true" />
              </div>
              <h3 className="mt-12 text-3xl leading-tight text-ivory-50">{showroom.name}</h3>
              <p className="mt-2 text-[0.65rem] font-semibold tracking-[0.14em] text-brass-300 uppercase">
                {showroom.focus}
              </p>
              <p className="mt-5 text-sm leading-7 text-ivory-50/60">{showroom.description}</p>
              <p className="mt-auto border-t border-ivory-50/10 pt-5 text-[0.58rem] font-semibold tracking-[0.2em] text-ivory-50/60 uppercase">
                {showroom.detail}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-5 border-t border-ivory-50/15 pt-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
          <p className="text-[0.62rem] font-semibold tracking-[0.24em] text-brass-300 uppercase">
            Two workshops
          </p>
          <p className="max-w-2xl text-base leading-7 text-ivory-50/60">
            Both service workshops support all three houses. Workshop bays, advisor diaries, and
            service capacity are planned to be checked at the moment a booking is confirmed — not a
            day later.
          </p>
        </div>
      </Container>
    </section>
  );
}
