import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SpotlightCoachBannerProps {
  onContactClick?: () => void;
  linkToCoaches?: boolean;
}

const SpotlightCoachBanner = ({ onContactClick, linkToCoaches = false }: SpotlightCoachBannerProps) => {
  const content = (
    <img 
      src="/lovable-uploads/79296991-7232-4da1-add6-3f97dc1f6a84.png" 
      alt="Sean Kanan - Spotlight Acting Coach - Click to view coaches"
      className="w-full h-auto object-contain rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
    />
  );

  if (linkToCoaches && !onContactClick) {
    return (
      <Link to="/coaches" className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

export default SpotlightCoachBanner;