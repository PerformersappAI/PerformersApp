import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

export type FAQItem = {
  question: string;
  answer: string;
};

const defaultItems: FAQItem[] = [
  {
    question: "What is MyAuditionAI and who is it for?",
    answer:
      "MyAuditionAI helps actors analyze scripts, rehearse their lines, and get AI-powered feedback on videos and headshots—great for students, pros, and coaches.",
  },
  {
    question: "How does Scene Analysis work?",
    answer:
      "Upload a PDF or paste your text. Our AI extracts characters, beats, and notes. You can manage results in your Dashboard and export reports as PDF.",
  },
  {
    question: "Do you evaluate audition videos?",
    answer:
      "Yes. Upload a take to get structured notes (framing, delivery, pacing) and a shareable report you can email to yourself or a coach.",
  },
  {
    question: "What file types are supported?",
    answer:
      "PDF and plain text for scripts; common video formats for analysis. If your script is an image, use OCR upload to extract text first.",
  },
  {
    question: "Is my data private?",
    answer:
      "We never sell your data. Your uploads are secured via our Supabase backend. You control your content and can delete items in Dashboard.",
  },
  {
    question: "How does billing work?",
    answer:
      "See Membership for tiers. Pay with card or PayPal. You can cancel anytime from your account and keep access until the end of the period.",
  },
  {
    question: "Is there a free trial or usage limit?",
    answer:
      "We offer limited free usage for new users to explore features. For extended access and higher limits, choose a Membership plan.",
  },
  {
    question: "Can I bring ACTORS AI to my school or studio?",
    answer:
      "Yes. Use the Contact page to reach us—select the preset for bringing the program to your school and we’ll follow up with details.",
  },
  {
    question: "Who are the instructors/coaches?",
    answer:
      "Industry pros including Rick Zieff and Will Roberts contribute expert insight, combining traditional training with modern AI tools.",
  },
];

interface FAQSectionProps {
  items?: FAQItem[];
  compact?: boolean;
  showQuestionBox?: boolean;
  className?: string;
}

export default function FAQSection({
  items = defaultItems,
  compact = false,
  showQuestionBox = false,
  className,
}: FAQSectionProps) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const visible = compact ? items.slice(0, 6) : items;

  const submitQuestion = () => {
    if (!question.trim()) return;
    navigate("/contact", {
      state: {
        subject: "Question about MyAuditionAI",
        message: `Hi team, I have a question: ${question}`,
      },
    });
  };

  return (
    <section className={className} aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto">
        <h2 id="faq-heading" className="text-3xl font-bold mb-6 text-white">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {visible.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left text-white">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {showQuestionBox && (
          <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              Didn’t see your question? Ask us below and we’ll get back to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Use a compact two-line field for brief questions */}
              <Textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question (1–2 lines)…"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Button
                onClick={submitQuestion}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold sm:self-start"
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
