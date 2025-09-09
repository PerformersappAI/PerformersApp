import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { ProfileVideoUpload } from "@/components/ProfileVideoUpload";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Loader2, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
    experience_level: "beginner",
    acting_methods: [] as string[],
    avatar_url: "",
    headshot_url_1: "",
    headshot_url_2: "",
    headshot_url_3: "",
    demo_video_url_1: "",
    demo_video_url_2: "",
    demo_video_title_1: "",
    demo_video_title_2: "",
    resume_pdf_url: "",
    manager_name: "",
    manager_phone: "",
    manager_email: "",
    agent_commercial_name: "",
    agent_commercial_phone: "",
    agent_commercial_email: "",
    agent_theatrical_name: "",
    agent_theatrical_phone: "",
    agent_theatrical_email: "",
    agency_url: "",
    talent_phone: "",
    talent_email: "",
    instagram_url: "",
    website_url: "",
    imdb_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          bio: data.bio || "",
          experience_level: data.experience_level || "beginner",
          acting_methods: data.acting_methods || [],
          avatar_url: data.avatar_url || "",
          headshot_url_1: data.headshot_url_1 || "",
          headshot_url_2: data.headshot_url_2 || "",
          headshot_url_3: data.headshot_url_3 || "",
          demo_video_url_1: data.demo_video_url_1 || "",
          demo_video_url_2: data.demo_video_url_2 || "",
          demo_video_title_1: data.demo_video_title_1 || "",
          demo_video_title_2: data.demo_video_title_2 || "",
          resume_pdf_url: data.resume_pdf_url || "",
          manager_name: data.manager_name || "",
          manager_phone: data.manager_phone || "",
          manager_email: data.manager_email || "",
          agent_commercial_name: data.agent_commercial_name || "",
          agent_commercial_phone: data.agent_commercial_phone || "",
          agent_commercial_email: data.agent_commercial_email || "",
          agent_theatrical_name: data.agent_theatrical_name || "",
          agent_theatrical_phone: data.agent_theatrical_phone || "",
          agent_theatrical_email: data.agent_theatrical_email || "",
          agency_url: data.agency_url || "",
          talent_phone: data.talent_phone || "",
          talent_email: data.talent_email || "",
          instagram_url: data.instagram_url || "",
          website_url: data.website_url || "",
          imdb_url: data.imdb_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800 pt-16">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Profile'} />
                <AvatarFallback>{(profile.full_name || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {profile.full_name || "Actor Profile"}
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  Manage your professional acting profile
                </p>
              </div>
            </div>
            
            {profile.username && (
              <Button asChild className="btn-brand-yellow">
                <a 
                  href={`/profile/${profile.username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Profile
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Picture */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <ProfileImageUpload
                  label="Profile Picture"
                  currentUrl={profile.avatar_url}
                  onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input 
                    id="username" 
                    value={profile.username} 
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-300">Biography</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about your acting background, experience, and goals..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Headshots */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Headshots (up to 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProfileImageUpload
                  label="Headshot 1"
                  currentUrl={profile.headshot_url_1}
                  onUpload={(url) => setProfile({ ...profile, headshot_url_1: url })}
                />
                <ProfileImageUpload
                  label="Headshot 2"
                  currentUrl={profile.headshot_url_2}
                  onUpload={(url) => setProfile({ ...profile, headshot_url_2: url })}
                />
                <ProfileImageUpload
                  label="Headshot 3"
                  currentUrl={profile.headshot_url_3}
                  onUpload={(url) => setProfile({ ...profile, headshot_url_3: url })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Demo Videos */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Demo Reels (up to 2)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfileVideoUpload
                label="Demo Reel 1"
                currentUrl={profile.demo_video_url_1}
                currentTitle={profile.demo_video_title_1}
                onUpload={(url) => setProfile({ ...profile, demo_video_url_1: url })}
                onTitleChange={(title) => setProfile({ ...profile, demo_video_title_1: title })}
              />
              <ProfileVideoUpload
                label="Demo Reel 2"
                currentUrl={profile.demo_video_url_2}
                currentTitle={profile.demo_video_title_2}
                onUpload={(url) => setProfile({ ...profile, demo_video_url_2: url })}
                onTitleChange={(title) => setProfile({ ...profile, demo_video_title_2: title })}
              />
            </CardContent>
          </Card>

          {/* Resume */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeUpload
                currentUrl={profile.resume_pdf_url}
                onUpload={(url) => setProfile({ ...profile, resume_pdf_url: url })}
              />
            </CardContent>
          </Card>

          {/* Professional Contacts */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Professional Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Manager</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="manager_name" className="text-gray-300">Name</Label>
                    <Input
                      id="manager_name"
                      value={profile.manager_name}
                      onChange={(e) => setProfile({ ...profile, manager_name: e.target.value })}
                      placeholder="Manager's name"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager_phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="manager_phone"
                      type="tel"
                      value={profile.manager_phone}
                      onChange={(e) => setProfile({ ...profile, manager_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager_email" className="text-gray-300">Email</Label>
                    <Input
                      id="manager_email"
                      type="email"
                      value={profile.manager_email}
                      onChange={(e) => setProfile({ ...profile, manager_email: e.target.value })}
                      placeholder="manager@email.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Commercial Agent</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="agent_commercial_name" className="text-gray-300">Name</Label>
                    <Input
                      id="agent_commercial_name"
                      value={profile.agent_commercial_name}
                      onChange={(e) => setProfile({ ...profile, agent_commercial_name: e.target.value })}
                      placeholder="Commercial agent's name"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent_commercial_phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="agent_commercial_phone"
                      type="tel"
                      value={profile.agent_commercial_phone}
                      onChange={(e) => setProfile({ ...profile, agent_commercial_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent_commercial_email" className="text-gray-300">Email</Label>
                    <Input
                      id="agent_commercial_email"
                      type="email"
                      value={profile.agent_commercial_email}
                      onChange={(e) => setProfile({ ...profile, agent_commercial_email: e.target.value })}
                      placeholder="agent@email.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Theatrical Agent</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="agent_theatrical_name" className="text-gray-300">Name</Label>
                    <Input
                      id="agent_theatrical_name"
                      value={profile.agent_theatrical_name}
                      onChange={(e) => setProfile({ ...profile, agent_theatrical_name: e.target.value })}
                      placeholder="Theatrical agent's name"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent_theatrical_phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="agent_theatrical_phone"
                      type="tel"
                      value={profile.agent_theatrical_phone}
                      onChange={(e) => setProfile({ ...profile, agent_theatrical_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent_theatrical_email" className="text-gray-300">Email</Label>
                    <Input
                      id="agent_theatrical_email"
                      type="email"
                      value={profile.agent_theatrical_email}
                      onChange={(e) => setProfile({ ...profile, agent_theatrical_email: e.target.value })}
                      placeholder="agent@email.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Agency</h4>
                <div>
                  <Label htmlFor="agency_url" className="text-gray-300">Agency Website</Label>
                  <Input
                    id="agency_url"
                    type="url"
                    value={profile.agency_url}
                    onChange={(e) => setProfile({ ...profile, agency_url: e.target.value })}
                    placeholder="https://agency.com"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Direct Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="talent_phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="talent_phone"
                      type="tel"
                      value={profile.talent_phone}
                      onChange={(e) => setProfile({ ...profile, talent_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="talent_email" className="text-gray-300">Email</Label>
                    <Input
                      id="talent_email"
                      type="email"
                      value={profile.talent_email}
                      onChange={(e) => setProfile({ ...profile, talent_email: e.target.value })}
                      placeholder="actor@email.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url" className="text-gray-300">Instagram</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={profile.instagram_url}
                      onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website_url" className="text-gray-300">Website</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={profile.website_url}
                      onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="imdb_url" className="text-gray-300">IMDb Profile</Label>
                  <Input
                    id="imdb_url"
                    type="url"
                    value={profile.imdb_url}
                    onChange={(e) => setProfile({ ...profile, imdb_url: e.target.value })}
                    placeholder="https://imdb.com/name/nm1234567"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
