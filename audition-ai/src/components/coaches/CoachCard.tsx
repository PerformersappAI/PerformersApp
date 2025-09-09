
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Coach {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  highlights: string[];
  photo_url: string | null;
  email: string | null;
  active: boolean;
}

interface CoachCardProps {
  coach: Coach;
}

const CoachCard = ({ coach }: CoachCardProps) => {
  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-purple-400 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
            {coach.photo_url ? (
              <img
                src={coach.photo_url}
                alt={coach.name}
                className="w-24 h-24 rounded-lg object-cover border-2 border-purple-400"
                onError={(e) => {
                  console.warn(`Failed to load coach photo: ${coach.photo_url}`);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-24 h-24 rounded-lg bg-gray-800 border-2 border-purple-400 flex items-center justify-center text-purple-400 font-bold text-lg ${coach.photo_url ? 'hidden' : ''}`}>
              {coach.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{coach.name}</h3>
          
          {coach.bio && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
              {coach.bio}
            </p>
          )}

          {coach.highlights.length > 0 && (
            <div className="w-full mb-4">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Highlights:</h4>
              <div className="space-y-1">
                {coach.highlights.slice(0, 3).map((highlight, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-gray-800 text-gray-300 block text-center"
                  >
                    {highlight.length > 50 ? `${highlight.slice(0, 50)}...` : highlight}
                  </Badge>
                ))}
                {coach.highlights.length > 3 && (
                  <Badge variant="outline" className="text-xs text-purple-400">
                    +{coach.highlights.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Link to={`/coaches/${coach.slug}`} className="w-full">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Contact {coach.name.split(' ')[0]}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CoachCard;
