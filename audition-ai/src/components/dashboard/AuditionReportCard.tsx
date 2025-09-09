import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditionReportCardProps {
  defaultEmail?: string;
}

const AuditionReportCard: React.FC<AuditionReportCardProps> = ({ defaultEmail }) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string>(defaultEmail ?? "");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sending, setSending] = useState(false);

  const parseEmails = (value: string): string[] => {
    return value
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => !!e)
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const handleSend = async () => {
    const recipients = parseEmails(emails);

    if (recipients.length === 0) {
      toast({
        title: "Add at least one valid email",
        description: "Enter one or more emails separated by commas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.functions.invoke("send-audition-report", {
        body: {
          to: recipients,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Report sent",
        description: "Your audition report has been emailed successfully.",
      });
    } catch (err: any) {
      console.error("Error sending report:", err);
      toast({
        title: "Failed to send",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="audition-report-heading">
      <Card className="bg-card border-border text-foreground">
        <CardHeader>
          <CardTitle id="audition-report-heading" className="text-foreground">Send Your Audition Report</CardTitle>
          <CardDescription className="text-muted-foreground">
            Email a summary of your auditions to yourself, an agent, or a manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="emails" className="text-foreground">Recipient emails</Label>
              <Input
                id="emails"
                placeholder="you@example.com, agent@agency.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                aria-describedby="emails-help"
              />
              <p id="emails-help" className="text-xs text-muted-foreground mt-1">
                Separate multiple emails with commas
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate" className="text-foreground">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate" className="text-foreground">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSend} disabled={sending} className="bg-purple-600 hover:bg-purple-700">
              {sending ? "Sending..." : "Send Audition Report"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default AuditionReportCard;
