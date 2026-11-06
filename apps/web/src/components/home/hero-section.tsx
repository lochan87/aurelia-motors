import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '../ui/button-styles';

const stats = [
  { value: '03', label: 'Showrooms planned' },
  { value: '02', label: 'Workshops planned' },
  { value: '01', label: 'Standard' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-ivory-50">
      <div className="mx-auto grid w-full max-w-[110rem] lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[1.04fr_0.96fr]">
        <div className="relative z-10 flex flex-col justify-between px-5 pt-14 pb-10 sm:px-8 lg:px-12 lg:pt-20 lg:pb-12 xl:px-20">
          <div>
            <p className="animate-rise flex items-center gap-3 text-[0.62rem] font-semibold tracking-[0.28em] text-ivory-50/55 uppercase">
              <span className="h-px w-8 bg-brass-400" aria-hidden="true" />
              Aurelia Motors · Lucknow
            </p>

            <h1 className="animate-rise-delay-1 mt-10 max-w-3xl text-[clamp(2.9rem,5.3vw,5.6rem)] leading-[0.96] text-balance text-ivory-50">
              Considered, from the <em className="text-brass-300 italic">first drive</em> to the
              last detail.
            </h1>

            <p className="animate-rise-delay-2 mt-8 max-w-xl text-base leading-7 text-ivory-50/65 sm:text-lg sm:leading-8">
              New cars, certified pre-owned, and workshop care — brought together with an uncommon
              standard of attention in Lucknow.
            </p>

            <div className="animate-rise-delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/vehicles" className={buttonStyles({ variant: 'primary' })}>
                Explore new vehicles
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link to="/certified" className={buttonStyles({ variant: 'outline-light' })}>
                Certified pre-owned
              </Link>
              <Link
                to="/#showrooms"
                className="group inline-flex items-center gap-2 px-2 py-3 text-[0.68rem] font-semibold tracking-[0.18em] text-ivory-50/70 uppercase transition-colors hover:text-brass-300"
              >
                Our showrooms
                <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <dl className="mt-16 grid max-w-xl grid-cols-3 gap-4 border-t border-ivory-50/15 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl text-brass-300 sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-[0.55rem] font-semibold tracking-[0.2em] text-ivory-50/60 uppercase">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="relative min-h-[48vh] overflow-hidden lg:min-h-full">
          <img
            src="/images/night-drive.jpg"
            alt="Silhouette of a car with its headlights on at dusk"
            width={2000}
            height={1500}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[42%_65%] grayscale"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/15 to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-ink-950/10"
            aria-hidden="true"
          />
          <figcaption className="absolute right-5 bottom-5 text-right text-[0.55rem] font-semibold tracking-[0.2em] text-ivory-50/55 uppercase sm:right-8 sm:bottom-8">
            Night drive · Lucknow
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
