import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, ExternalLink } from "lucide-react";
import SectionHeading from "@/components/profile/SectionHeading";
import Pill from "@/components/profile/Pill";
import { InfoList } from "@/components/profile/InfoList";
import VideoCard from "@/components/profile/VideoCard";
import { toast } from "sonner";

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  acting_methods: string[];
  experience_level: string;
  headshot_url_1: string;
  headshot_url_2: string;
  headshot_url_3: string;
  demo_video_url_1: string;
  demo_video_url_2: string;
  demo_video_title_1: string;
  demo_video_title_2: string;
  instagram_url: string;
  website_url: string;
  imdb_url: string;
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      try {
        const { data, error } = await supabase
          .rpc('get_public_profile', { p_username: username });

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Profile not found");
          return;
        }

        if (!data || data.length === 0) {
          toast.error("Profile not found");
          return;
        }

        setProfile(data[0]);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to MyAuditionAI.com</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Profile Not Found</h1>
            <p className="text-muted-foreground">The requested actor profile could not be found.</p>
            <Button asChild className="mt-4">
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const headshots = [
    profile.headshot_url_1,
    profile.headshot_url_2,
    profile.headshot_url_3,
  ].filter(Boolean);

  const demoVideos = [
    { url: profile.demo_video_url_1, title: profile.demo_video_title_1 },
    { url: profile.demo_video_url_2, title: profile.demo_video_title_2 },
  ].filter((video) => video.url);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to MyAuditionAI.com</span>
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 self-start">
              {/* Primary Headshot */}
              {headshots[0] && (
                <div className="overflow-hidden rounded-lg border bg-card">
                  <img
                    src={headshots[0]}
                    alt={`${profile.full_name} - Primary Headshot`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Links */}
              {(profile.instagram_url || profile.website_url || profile.imdb_url) && (
                <section>
                  <SectionHeading>Links</SectionHeading>
                  <div className="mt-4">
                    <InfoList
                      items={[
                        profile.instagram_url ? { label: "Instagram", value: "View Profile", href: profile.instagram_url } : {},
                        profile.website_url ? { label: "Website", value: profile.website_url, href: profile.website_url } : {},
                        profile.imdb_url ? { label: "IMDb", value: "View IMDb Profile", href: profile.imdb_url } : {},
                      ].filter((i) => Object.keys(i).length > 0) as any}
                    />
                  </div>
                </section>
              )}
            </aside>

            {/* Main */}
            <main className="lg:col-span-8 space-y-8">
              <header>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">{profile.full_name}</h1>
                <p className="text-muted-foreground mt-1">Professional Actor</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.experience_level && (
                    <Pill>{profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} Level</Pill>
                  )}
                  <Pill>@{profile.username}</Pill>
                </div>
              </header>

              {/* Bio */}
              {profile.bio && (
                <section>
                  <SectionHeading>Biography</SectionHeading>
                  <article className="prose prose-sm md:prose-base dark:prose-invert mt-4 max-w-none">
                    <p>{profile.bio}</p>
                  </article>
                </section>
              )}

              {/* Training & Methods */}
              {profile.acting_methods && profile.acting_methods.length > 0 && (
                <section>
                  <SectionHeading>Training & Methods</SectionHeading>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.acting_methods.map((method, i) => (
                      <Pill key={i}>{method}</Pill>
                    ))}
                  </div>
                </section>
              )}

              {/* Headshots */}
              {headshots.length > 1 && (
                <section>
                  <SectionHeading>Headshots</SectionHeading>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {headshots.slice(1).map((url, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-md border">
                        <img
                          src={url}
                          alt={`${profile.full_name} - Headshot ${index + 2}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
                          aria-label="View full size"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white inline-flex items-center gap-2 text-sm">
                            <ExternalLink className="w-4 h-4" /> View Full Size
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Demo Reels */}
              {demoVideos.length > 0 && (
                <section>
                  <SectionHeading>Demo Reels</SectionHeading>
                  <div className="mt-4 grid gap-6">
                    {demoVideos.map((video, i) => (
                      <VideoCard key={i} url={video.url} title={video.title} />
                    ))}
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" size="lg">Contact for Casting</Button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}