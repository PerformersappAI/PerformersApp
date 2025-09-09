import { useEffect } from "react";
import Navigation from "@/components/Navigation";

const Terms = () => {
  useEffect(() => {
    // SEO meta tags
    document.title = "Terms of Use | MyAuditionAI";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Terms of Use for MyAuditionAI - Review our service terms, user responsibilities, and platform guidelines for AI-powered acting tools.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Terms of Use for MyAuditionAI - Review our service terms, user responsibilities, and platform guidelines for AI-powered acting tools.";
      document.head.appendChild(meta);
    }

    // Canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", window.location.origin + "/terms");
    } else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.origin + "/terms";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Use</h1>
            <p className="text-muted-foreground text-lg">
              Guidelines and conditions for using MyAuditionAI services
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Eligibility</h2>
              <p className="text-muted-foreground">
                Users must be at least 13 years old (or 16 in some jurisdictions) to create an account. By signing up, you confirm that you meet the age requirement and agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptable Use</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You may only upload scripts, videos, and headshots that you own or have the rights to use.</li>
                <li>You agree not to misuse the platform (e.g., uploading harmful files, spamming, or misrepresenting your identity).</li>
                <li>You agree not to attempt to reverse engineer, hack, or exploit the platform's technology.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Membership & Billing</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Free demo accounts include limited access to features.</li>
                <li>Paid subscriptions (Pro, $19.99/month) are billed monthly and may be canceled anytime via your account settings. Access remains until the end of the paid period.</li>
                <li>Refunds are handled on a case-by-case basis where required by law.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">AI-Generated Content</h2>
              <p className="text-muted-foreground">
                All AI-generated analysis, feedback, or suggestions are tools to assist your preparation, not professional or legal advice. MyAuditionAI is not responsible for casting decisions, career outcomes, or third-party interpretations of your audition materials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Termination of Use</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these Terms, misuse the platform, or engage in fraudulent activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the state where MyAuditionAI is registered. Any disputes will be resolved under that jurisdiction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Terms;