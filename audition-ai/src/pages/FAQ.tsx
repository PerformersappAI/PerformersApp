import Navigation from "@/components/Navigation";
import FAQSection from "@/components/FAQSection";
import { useEffect } from "react";

export default function FAQ() {
  useEffect(() => {
    const title = "FAQ | MyAuditionAI";
    const description =
      "Answers about scene analysis, video evaluation, privacy, and membership.";
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Canonical tag
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);

    // FAQPage JSON-LD
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Scene Analysis work?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Upload a PDF or paste your text. Our AI extracts characters, beats, and notes. You can manage results in your Dashboard and export reports as PDF.",
          },
        },
        {
          "@type": "Question",
          name: "Is my data private?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "We never sell your data. Your uploads are secured via our Supabase backend. You control your content and can delete items in Dashboard.",
          },
        },
      ],
    });
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Quick answers about Scene Analysis, Video Evaluation, privacy, and membership.
            </p>
          </header>

          <article className="bg-gray-900/50 border border-gray-700 rounded-xl p-6" aria-label="FAQ list">
            <FAQSection compact={false} showQuestionBox className="" />
          </article>
        </div>
      </main>
    </div>
  );
}
