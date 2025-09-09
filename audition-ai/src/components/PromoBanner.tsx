
import { Link } from "react-router-dom";

const PromoBanner = () => {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Book a Coach banner */}
          <div className="flex-[1.35]">
            <Link to="/coaches" className="block hover:opacity-90 transition-opacity">
              <img 
                src="/lovable-uploads/fc5ad1be-fef6-4291-bd9e-7853e3088982.png" 
                alt="Book a Coach banner - Click to view available coaches"
                className="w-full h-auto object-contain rounded-lg cursor-pointer"
              />
            </Link>
          </div>
          
          {/* Sean Kanan banner - reduced 50% */}
          <div className="flex-1">
            <Link to="/coaches" className="block hover:opacity-90 transition-opacity">
              <img 
                src="/lovable-uploads/4a72a089-4a5a-49b2-ab0d-67a79e8a279c.png" 
                alt="Spotlight Coach Sean Kanan banner - Click to view available coaches"
                className="w-1/2 h-auto object-contain rounded-lg cursor-pointer mx-auto"
                onError={(e) => { e.currentTarget.src = "/seancoach.png"; }}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
