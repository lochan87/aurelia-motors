import { Container } from '../ui/container';
import { SectionHeader } from '../ui/section-header';

const principles = [
  {
    number: '01',
    title: 'The full price, not a headline.',
    body: 'Ex-showroom, road tax, insurance, accessories, and registration — shown separately, added honestly, before you commit.',
  },
  {
    number: '02',
    title: 'The right car, in the right place.',
    body: 'Live stock and demo vehicles are tied to their showroom, so the car you book is the car you actually drive.',
  },
  {
    number: '03',
    title: 'Your time, accounted for.',
    body: 'Workshop capacity is checked before a service slot is confirmed. No hopeful pencil entries, no waiting-room surprises.',
  },
];

export function StandardSection() {
  return (
    <section id="standard" className="scroll-mt-24 bg-ivory-50 py-24 lg:py-32">
      <Container>
        <SectionHeader
          index="01"
          eyebrow="The standard"
          title={
            <>
              Everything in <em className="text-brass-500 italic">plain sight.</em>
            </>
          }
          description="A dealership should not ask you to take its word for it. Every price, every inspection, and every appointment is designed to be read, understood, and trusted before you commit."
        />

        <div className="mt-16 grid gap-px border border-sand-200 bg-sand-200 md:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle.number} className="bg-ivory-50 p-8 lg:p-10">
              <p className="text-[0.62rem] font-semibold tracking-[0.24em] text-brass-500 uppercase">
                {principle.number}
              </p>
              <h3 className="mt-16 max-w-xs text-2xl leading-snug text-ink-950">
                {principle.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-stone-600">{principle.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
