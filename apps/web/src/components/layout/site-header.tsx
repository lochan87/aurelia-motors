import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '../../lib/utils';
import { BrandMark } from '../ui/brand-mark';
import { Container } from '../ui/container';

const navigation = [
  { label: 'The standard', href: '/#standard' },
  { label: 'Showrooms', href: '/#showrooms' },
  { label: 'Certified', href: '/#certified' },
  { label: 'Workshop', href: '/#workshop' },
  { label: 'Visit', href: '/#visit' },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-ivory-50/10 bg-ink-950/95 text-ivory-50 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between lg:h-24">
        <Link
          to="/"
          className="group inline-flex items-center gap-3"
          onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <BrandMark className="h-9 w-9 text-brass-400 transition-colors group-hover:text-brass-300" />
          <span className="flex flex-col">
            <span className="font-display text-[1.35rem] leading-none tracking-[0.2em] text-ivory-50">
              AURELIA
            </span>
            <span className="mt-1.5 text-[0.52rem] leading-none font-semibold tracking-[0.32em] text-ivory-50/55 uppercase">
              Motors · Lucknow
            </span>
            <span className="sr-only">home</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-[0.65rem] font-semibold tracking-[0.2em] text-ivory-50/70 uppercase transition-colors hover:text-brass-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory-50/20 text-ivory-50 transition-colors hover:border-brass-300 hover:text-brass-300 lg:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </Container>

      {isMenuOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-ivory-50/10 bg-ink-950 lg:hidden"
        >
          <Container className="flex flex-col py-6">
            <nav aria-label="Mobile primary" className="flex flex-col">
              {navigation.map((item, index) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-baseline gap-4 border-ivory-50/10 py-4 font-display text-3xl text-ivory-50 transition-colors hover:text-brass-300',
                    index !== navigation.length - 1 && 'border-b',
                  )}
                >
                  <span className="font-sans text-[0.6rem] font-semibold tracking-[0.2em] text-brass-300">
                    0{index + 1}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="mt-8 border-t border-ivory-50/10 pt-5 text-xs leading-6 text-ivory-50/50">
              Three showrooms and two workshops in Lucknow. Appointment details will be published as
              each location opens.
            </p>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
