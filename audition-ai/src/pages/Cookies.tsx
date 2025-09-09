import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Cookies = () => {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    performance: true,
    marketing: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // SEO meta tags
    document.title = "Cookie Preferences | MyAuditionAI";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Manage your cookie preferences for MyAuditionAI - Control how we use cookies to improve your experience on our platform.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Manage your cookie preferences for MyAuditionAI - Control how we use cookies to improve your experience on our platform.";
      document.head.appendChild(meta);
    }

    // Canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", window.location.origin + "/cookies");
    } else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.origin + "/cookies";
      document.head.appendChild(link);
    }

    // Load saved preferences
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved cookie preferences');
      }
    }
  }, []);

  const handleToggle = (type: keyof typeof preferences) => {
    if (type === 'essential') return; // Can't disable essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const savePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    toast({
      title: "Preferences Saved",
      description: "Your cookie preferences have been updated.",
    });
  };

  const cookieTypes = [
    {
      key: 'essential' as const,
      title: 'Essential Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      required: false,
    },
    {
      key: 'performance' as const,
      title: 'Performance Cookies',
      description: 'Used to improve website performance and user experience.',
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and marketing content.',
      required: false,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Preferences</h1>
            <p className="text-muted-foreground text-lg">
              Manage how we use cookies to enhance your experience
            </p>
          </header>

          <div className="space-y-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                Cookies are small files stored on your device that help us provide and improve our services. 
                You can control which types of cookies you allow below. Note that disabling some cookies 
                may affect website functionality.
              </p>
            </div>

            <div className="grid gap-4">
              {cookieTypes.map((cookie) => (
                <Card key={cookie.key} className="border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{cookie.title}</CardTitle>
                      <CardDescription>{cookie.description}</CardDescription>
                    </div>
                    <Switch
                      checked={preferences[cookie.key]}
                      onCheckedChange={() => handleToggle(cookie.key)}
                      disabled={cookie.required}
                      aria-label={`Toggle ${cookie.title}`}
                    />
                  </CardHeader>
                  {cookie.required && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        This type of cookie is required and cannot be disabled.
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-start pt-4">
              <Button onClick={savePreferences} className="px-8">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cookies;