import { Container } from '../ui/container';

export function InterludeSection() {
  return (
    <section
      aria-label="A note on care"
      className="relative isolate overflow-hidden bg-ink-950 py-24 text-ivory-50 lg:py-32"
    >
      <img
        src="/images/night-drive.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_72%] opacity-25 grayscale"
      />
      <div className="absolute inset-0 -z-10 bg-ink-950/65" aria-hidden="true" />
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[0.6rem] font-semibold tracking-[0.28em] text-brass-300 uppercase">
            The Aurelia standard
          </p>
          <blockquote className="mt-7 font-display text-3xl leading-[1.15] text-balance text-ivory-50 sm:text-4xl lg:text-5xl">
            “The car is the beginning of the relationship, not the whole of it.”
          </blockquote>
          <p className="mt-7 text-[0.6rem] font-semibold tracking-[0.24em] text-ivory-50/55 uppercase">
            Lucknow · Uttar Pradesh
          </p>
        </div>
      </Container>
    </section>
  );
}
