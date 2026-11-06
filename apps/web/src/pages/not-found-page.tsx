import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '../components/ui/button-styles';
import { Container } from '../components/ui/container';

export function NotFoundPage() {
  return (
    <section className="bg-ivory-50 py-24 lg:py-36">
      <Container>
        <div className="max-w-3xl">
          <p className="text-[0.62rem] font-semibold tracking-[0.28em] text-brass-500 uppercase">
            Error 404
          </p>
          <h1 className="mt-8 text-[clamp(3.5rem,9vw,7rem)] leading-[0.9] text-ink-950">
            This road <em className="text-brass-500 italic">ends here.</em>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
            The page you were looking for is not part of the showroom. It may have moved, or it may
            not have been built yet.
          </p>
          <Link to="/" className={buttonStyles({ variant: 'outline-dark', className: 'mt-10' })}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Return to Aurelia Motors
          </Link>
        </div>
      </Container>
    </section>
  );
}
