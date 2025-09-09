
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PromoBanner from "@/components/PromoBanner";
import MethodologySection from "@/components/MethodologySection";
import CTASection from "@/components/CTASection";
import TestimonialsMarquee from "@/components/TestimonialsMarquee";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="h-16"></div>
      <Hero />
      <PromoBanner />
      <MethodologySection />
      <CTASection />
      <TestimonialsMarquee variant="launchDark" />
    </div>
  );
};

export default Index;
