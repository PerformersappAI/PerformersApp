
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Coach {
  id: string;
  name: string;
  slug: string;
  email: string | null;
}

interface CoachContactFormProps {
  coach: Coach;
  onSuccess: () => void;
  onCancel: () => void;
}

const CoachContactForm = ({ coach, onSuccess, onCancel }: CoachContactFormProps) => {
  const [formData, setFormData] = useState({
    actorName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-coach-inquiry', {
        body: {
          coachSlug: coach.slug,
          actorName: formData.actorName,
          actorEmail: formData.email,
          actorPhone: formData.phone || null,
          message: formData.message
        }
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: `Your inquiry has been sent to ${coach.name}. They will get back to you soon.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error sending inquiry:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-purple-400">
          Contact {coach.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="actorName" className="text-white">Your Name *</Label>
            <Input
              id="actorName"
              type="text"
              value={formData.actorName}
              onChange={(e) => setFormData(prev => ({ ...prev, actorName: e.target.value }))}
              required
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-white">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
              rows={5}
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="Tell the coach about your goals, experience level, and what you're looking to work on..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CoachContactForm;
