import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { EnquiryModal } from '../enquiry/enquiry-modal';
import { buttonStyles } from '../ui/button-styles';
import { Container } from '../ui/container';

const locations = ['Central Lucknow', 'Gomti Nagar', 'Sushant Golf City'];

export function VisitSection() {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  return (
    <section id="visit" className="scroll-mt-24 bg-sand-200 py-24 lg:py-32">
      <Container>
        <div className="grid gap-14 border-t border-ink-950/15 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-24">
          <div>
            <p className="flex items-center gap-3 text-[0.62rem] font-semibold tracking-[0.26em] text-stone-600 uppercase">
              <span className="text-brass-500">05</span>
              <span className="h-px w-7 bg-brass-500/60" aria-hidden="true" />
              Visit
            </p>
            <h2 className="mt-8 max-w-2xl text-4xl leading-[1.02] text-balance text-ink-950 sm:text-5xl lg:text-6xl">
              A new address for a <em className="text-brass-500 italic">familiar idea.</em>
            </h2>
            <p className="mt-7 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              Three showrooms across Lucknow are being prepared around a simple idea: the car should
              be exceptional, and so should the way you buy and care for it.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-stone-500">
              Appointment details, direct contacts, and opening hours are active across each
              location. Connect with our dedicated sales consultants for bespoke walkthroughs, test
              drives, and personalised quotations.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className={buttonStyles({ variant: 'primary', size: 'md' })}
              >
                <MessageSquare className="h-4 w-4" />
                Make a Showroom Enquiry
              </button>
            </div>
          </div>

          <div className="self-end">
            <p className="text-[0.6rem] font-semibold tracking-[0.24em] text-stone-600 uppercase">
              Planned Lucknow presence
            </p>
            <ul className="mt-6">
              {locations.map((location, index) => (
                <li
                  key={location}
                  className="flex items-baseline justify-between gap-6 border-t border-ink-950/15 py-4 last:border-b"
                >
                  <span className="font-display text-2xl text-ink-950">{location}</span>
                  <span className="text-[0.55rem] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                    Showroom 0{index + 1}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.6rem] font-semibold tracking-[0.18em] text-stone-500 uppercase">
              Two workshops · Capacity checked
            </p>
          </div>
        </div>

        <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
      </Container>
    </section>
  );
}
