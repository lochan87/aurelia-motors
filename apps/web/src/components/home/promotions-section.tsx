import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api-client';
import { Container } from '../ui/container';

export function PromotionsSection() {
  const { data: offersData } = useQuery({
    queryKey: ['public-offers'],
    queryFn: () => api.getOffers(),
  });

  const { data: bannersData } = useQuery({
    queryKey: ['public-banners'],
    queryFn: () => api.getBanners(),
  });

  const offers = offersData?.items || [];
  const banners = bannersData?.items || [];

  if (offers.length === 0 && banners.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-stone-200/80 bg-stone-50/50 py-16 sm:py-20">
      <Container>
        {/* Featured Hero Banner if present */}
        {banners.length > 0 && (
          <div className="relative mb-14 overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl">
            <div className="absolute inset-0 z-0">
              <img
                src={banners[0]?.imageUrl}
                alt={banners[0]?.headline}
                className="h-full w-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col justify-between p-8 sm:p-12 md:max-w-2xl lg:p-16">
              {banners[0]?.badgeText && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300 uppercase backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {banners[0].badgeText}
                </span>
              )}
              <h3 className="mt-4 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {banners[0]?.headline}
              </h3>
              {banners[0]?.subheadline && (
                <p className="mt-3 text-sm leading-relaxed text-stone-300 sm:text-base">
                  {banners[0].subheadline}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={banners[0]?.ctaUrl || '/test-drive'}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-semibold tracking-wider text-stone-900 uppercase shadow-sm transition hover:bg-stone-100"
                >
                  {banners[0]?.ctaLabel || 'Learn More'}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Promotional Offers Grid */}
        {offers.length > 0 && (
          <div>
            <div className="mb-8">
              <span className="text-[0.62rem] font-semibold tracking-[0.24em] text-amber-700 uppercase">
                Special Dealership Benefits
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
                Exclusive Dealership Offers in Lucknow
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    {offer.badgeText && (
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {offer.badgeText}
                      </span>
                    )}
                    <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">
                      {offer.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-stone-600">
                      {offer.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-stone-100 pt-4">
                    <Link
                      to={offer.ctaUrl || '/contact'}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 hover:text-amber-700"
                    >
                      {offer.ctaLabel || 'Enquire About Offer'}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
