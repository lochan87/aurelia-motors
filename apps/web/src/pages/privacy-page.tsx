import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Container } from '../components/ui/container';

const sections: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Who we are',
    body: (
      <p>
        Aurelia Motors is a temporary brand for a proposed authorised passenger-car dealership in
        Lucknow, Uttar Pradesh. The legal entity, registered address, and formal contact details
        will be published before public launch.
      </p>
    ),
  },
  {
    title: 'What we collect',
    body: (
      <p>
        When you enquire, book a test drive, request a service appointment, submit a trade-in, or
        ask for finance guidance, we may collect your name, phone number, email address, vehicle
        interests, preferred showroom or workshop, and the details you choose to share. We aim to
        collect only what is needed for the service you request.
      </p>
    ),
  },
  {
    title: 'Why we use it',
    body: (
      <p>
        We use personal information to respond to enquiries, arrange and manage appointments,
        prepare vehicle and service quotations, route your request to the right team, meet legal and
        accounting obligations, and improve the service we provide. We do not sell personal
        information.
      </p>
    ),
  },
  {
    title: 'Consent and choice',
    body: (
      <p>
        Where consent is required, we will ask for it separately, explain the purpose in plain
        language, and record when and how it was given. Consent will not be bundled into unrelated
        terms. You can withdraw consent for future contact at any time, subject to records we must
        retain by law.
      </p>
    ),
  },
  {
    title: 'Sharing',
    body: (
      <p>
        We may share the minimum necessary information with service providers who help us operate
        the platform, with the relevant vehicle manufacturer or its authorised partners, and with
        finance or insurance partners only when you ask us to. We may also disclose information
        where required by law or to protect legal rights.
      </p>
    ),
  },
  {
    title: 'Retention and security',
    body: (
      <p>
        We retain information only for as long as it is needed for the purpose it was collected, or
        as required for legal, tax, audit, and dispute-resolution obligations. Access is limited to
        people who need it, and we plan to use encryption in transit, access controls, audit logs,
        and least-privilege permissions.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <p>
        Subject to applicable law, you may request access to your personal information, ask for
        corrections, request erasure, withdraw consent, or raise a grievance. A grievance officer
        and a dedicated contact channel will be appointed and published before public launch.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        The website and dealership services are intended for adults. We do not knowingly collect
        personal information from children. If you believe a child has provided information, please
        contact us once the contact channel is published so we can address it.
      </p>
    ),
  },
  {
    title: 'Updates',
    body: (
      <p>
        This notice will change as the platform and the business are finalised. The current version
        will always be published on this page, with its effective date shown above.
      </p>
    ),
  },
];

export function PrivacyPage() {
  return (
    <section className="bg-ivory-50 py-16 lg:py-24">
      <Container>
        <article className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.18em] text-stone-500 uppercase transition-colors hover:text-brass-500"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back to Aurelia Motors
          </Link>

          <p className="mt-12 text-[0.62rem] font-semibold tracking-[0.28em] text-brass-500 uppercase">
            Privacy notice
          </p>
          <h1 className="mt-7 text-[clamp(2.7rem,6vw,4.5rem)] leading-[0.98] text-ink-950">
            Privacy, in <em className="text-brass-500 italic">plain language.</em>
          </h1>
          <p className="mt-6 text-sm leading-7 text-stone-500">
            Last updated 6 November 2026 · Pre-launch notice
          </p>

          <div className="mt-8 border-l-2 border-brass-400 bg-ivory-100 p-5 text-sm leading-7 text-stone-600">
            This is the foundation privacy notice for Aurelia Motors. It describes the intended
            approach and will be reviewed against the Digital Personal Data Protection Act, 2023 and
            finalised before public launch. It is not yet a live customer-facing policy.
          </div>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-ink-950/10 pt-7">
                <h2 className="text-2xl text-ink-950">{section.title}</h2>
                <div className="mt-3 text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-ink-950/10 pt-7">
            <h2 className="text-2xl text-ink-950">Contact</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
              A grievance officer and a dedicated privacy contact will be appointed and published
              before public launch. Until then, this page serves as the project&apos;s documented
              privacy baseline.
            </p>
          </div>
        </article>
      </Container>
    </section>
  );
}
