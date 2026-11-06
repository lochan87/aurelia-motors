import { CertifiedSection } from '../components/home/certified-section';
import { HeroSection } from '../components/home/hero-section';
import { InterludeSection } from '../components/home/interlude-section';
import { PromotionsSection } from '../components/home/promotions-section';
import { ShowroomsSection } from '../components/home/showrooms-section';
import { StandardSection } from '../components/home/standard-section';
import { VisitSection } from '../components/home/visit-section';
import { WorkshopSection } from '../components/home/workshop-section';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <PromotionsSection />
      <StandardSection />
      <ShowroomsSection />
      <CertifiedSection />
      <InterludeSection />
      <WorkshopSection />
      <VisitSection />
    </>
  );
}
