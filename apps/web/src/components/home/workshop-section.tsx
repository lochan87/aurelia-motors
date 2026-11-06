import { ClipboardCheck, UserRound, Wrench } from 'lucide-react';

import { Container } from '../ui/container';
import { SectionHeader } from '../ui/section-header';

const workshopPrinciples = [
  {
    icon: Wrench,
    title: 'Capacity, checked',
    body: 'A service slot is only confirmed when a workshop bay and an advisor are genuinely free.',
  },
  {
    icon: UserRound,
    title: 'A named advisor',
    body: 'One person owns your visit from booking to handover, so you never have to repeat yourself.',
  },
  {
    icon: ClipboardCheck,
    title: 'The estimate first',
    body: 'Work is explained and authorised before it begins. No surprises waiting at collection.',
  },
];

export function WorkshopSection() {
  return (
    <section id="workshop" className="scroll-mt-24 bg-ink-950 py-24 text-ivory-50 lg:py-32">
      <Container>
        <SectionHeader
          index="04"
          eyebrow="Workshop"
          tone="dark"
          title={
            <>
              Care that <em className="text-brass-300 italic">keeps its word.</em>
            </>
          }
          description="Two workshops, one standard. Service is booked against real capacity, with a named advisor and an estimate you see before the work begins."
        />

        <div className="mt-16 grid gap-10 border-t border-ivory-50/15 pt-10 md:grid-cols-3 md:gap-8">
          {workshopPrinciples.map((principle) => {
            const Icon = principle.icon;

            return (
              <article key={principle.title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brass-400/35 text-brass-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-7 text-2xl text-ivory-50">{principle.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-ivory-50/60">{principle.body}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
