import { useEffect } from "react";
import Navigation from "@/components/Navigation";

const Privacy = () => {
  useEffect(() => {
    // SEO meta tags
    document.title = "Privacy Policy | MyAuditionAI";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Privacy Policy for MyAuditionAI - Learn how we collect, use, and protect your data when using our AI-powered acting tools and services.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Privacy Policy for MyAuditionAI - Learn how we collect, use, and protect your data when using our AI-powered acting tools and services.";
      document.head.appendChild(meta);
    }

    // Canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", window.location.origin + "/privacy");
    } else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.origin + "/privacy";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              How we handle your personal information and data
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Uploaded scripts, videos, and headshots for analysis.</li>
                <li>Account details (email, username, payment information if applicable).</li>
                <li>Technical data (browser type, device type, usage analytics).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To provide AI scene analysis, audition feedback, and acting tools.</li>
                <li>To improve our platform and user experience.</li>
                <li>To process billing and membership subscriptions.</li>
                <li>To send service-related notifications (never spam marketing without consent).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely in our backend infrastructure (Supabase). Files uploaded for analysis remain private and under your control. You may delete your content at any time from your Dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell your personal data to third parties. Limited sharing may occur with service providers (e.g., payment processors, cloud storage partners) strictly to provide functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">User Rights</h2>
              <p className="text-muted-foreground">
                You have the right to request deletion of your data, access to stored files, and correction of account details. Requests can be submitted through our support channel.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Privacy;