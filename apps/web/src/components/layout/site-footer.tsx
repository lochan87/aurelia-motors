import { ArrowUpRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { BrandMark } from '../ui/brand-mark';
import { Container } from '../ui/container';

const exploreLinks = [
  { label: 'New vehicles', href: '/vehicles' },
  { label: 'Certified pre-owned', href: '/certified' },
  { label: 'Book test drive', href: '/test-drive' },
  { label: 'Book workshop service', href: '/service' },
  { label: 'Showrooms', href: '/#showrooms' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ivory-50/10 bg-ink-950 text-ivory-50">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.7fr_0.7fr] lg:gap-16">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <BrandMark className="h-10 w-10 text-brass-400" />
              <span className="flex flex-col">
                <span className="font-display text-[1.5rem] leading-none tracking-[0.2em]">
                  AURELIA
                </span>
                <span className="mt-1.5 text-[0.55rem] leading-none font-semibold tracking-[0.32em] text-ivory-50/55 uppercase">
                  Motors · Lucknow
                </span>
                <span className="sr-only">home</span>
              </span>
            </Link>
            <p className="mt-7 max-w-md text-sm leading-7 text-ivory-50/60">
              A considered home for new cars, certified pre-owned, and workshop care in Lucknow.
              Three showrooms, two workshops, one standard.
            </p>
            <p className="mt-6 text-[0.6rem] font-semibold tracking-[0.22em] text-ivory-50/55 uppercase">
              Authorised passenger-car dealer · Uttar Pradesh
            </p>
          </div>

          <div>
            <p className="text-[0.6rem] font-semibold tracking-[0.24em] text-brass-300 uppercase">
              Explore
            </p>
            <nav aria-label="Footer" className="mt-6 flex flex-col gap-3.5">
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-ivory-50/65 transition-colors hover:text-brass-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[0.6rem] font-semibold tracking-[0.24em] text-brass-300 uppercase">
              The fine print
            </p>
            <div className="mt-6 flex flex-col gap-3.5">
              <Link
                to="/privacy"
                className="text-sm text-ivory-50/65 transition-colors hover:text-brass-300"
              >
                Privacy notice
              </Link>
              <Link
                to="/staff/login"
                className="inline-flex items-center gap-1.5 text-sm text-ivory-50/65 transition-colors hover:text-brass-300"
              >
                <Lock className="h-3.5 w-3.5 text-brass-400" />
                <span>Staff console</span>
              </Link>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-ivory-50/15 px-3 py-1.5 text-[0.55rem] font-semibold tracking-[0.18em] text-ivory-50/60 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-brass-400" aria-hidden="true" />
              Preview build · 2026
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory-50/10 pt-6 text-[0.65rem] leading-5 text-ivory-50/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aurelia Motors. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-1.5">
            <span>Photography by Joshua Käller via</span>
            <a
              href="https://www.pexels.com/photo/silhouette-of-car-with-turned-on-light-790183/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ivory-50/60 underline decoration-ivory-50/25 underline-offset-4 transition-colors hover:text-brass-300"
            >
              Pexels
              <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
