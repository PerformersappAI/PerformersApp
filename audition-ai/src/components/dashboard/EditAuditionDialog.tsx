
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Audition, CreateAuditionData } from "@/types/audition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface EditAuditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAudition: (id: string, auditionData: CreateAuditionData) => Promise<void>;
  audition: Audition | null;
}

const EditAuditionDialog: React.FC<EditAuditionDialogProps> = ({
  isOpen,
  onClose,
  onUpdateAudition,
  audition,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateAuditionData>({
    title: "",
    casting_director: "",
    production_company: "",
    audition_date: "",
    audition_type: "self-tape",
    status: "preparation",
    notes: "",
    contact_email: "",
    contact_phone: "",
    contact_website: "",
    casting_director_preferences: "",
    casting_director_current_projects: "",
    submission_deadline: "",
    actor_email: "",
    reminder_enabled: false,
  });

  const [sendingTest, setSendingTest] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [reminderTiming, setReminderTiming] = useState<string>("1hour");
  const [customReminderTime, setCustomReminderTime] = useState<string>("");

  // Normalize ISO timestamp to 'YYYY-MM-DDTHH:mm' for datetime-local inputs
  const toDatetimeLocalValue = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16);
  };

  // Convert 'YYYY-MM-DDTHH:mm' local input back to ISO for storage
  const toISOFromLocalInput = (localValue?: string) => {
    if (!localValue) return undefined;
    const d = new Date(localValue);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const calculateReminderTime = () => {
    if (!formData.submission_deadline || !formData.reminder_enabled) return undefined;
    const deadline = new Date(formData.submission_deadline);
    let reminderTime: Date;
    switch (reminderTiming) {
      case "1hour":
        reminderTime = new Date(deadline.getTime() - 1 * 60 * 60 * 1000);
        break;
      case "2hours":
        reminderTime = new Date(deadline.getTime() - 2 * 60 * 60 * 1000);
        break;
      case "4hours":
        reminderTime = new Date(deadline.getTime() - 4 * 60 * 60 * 1000);
        break;
      case "1day":
        reminderTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "2days":
        reminderTime = new Date(deadline.getTime() - 2 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!customReminderTime) return undefined;
        reminderTime = new Date(customReminderTime);
        break;
      default:
        return undefined;
    }
    return reminderTime.toISOString();
  };

  useEffect(() => {
    if (audition) {
      setFormData({
        title: audition.title,
        casting_director: audition.casting_director || "",
        production_company: audition.production_company || "",
        audition_date: audition.audition_date || "",
        audition_type: audition.audition_type,
        status: audition.status,
        notes: audition.notes || "",
        contact_email: audition.contact_email || "",
        contact_phone: audition.contact_phone || "",
        contact_website: audition.contact_website || "",
        casting_director_preferences: audition.casting_director_preferences || "",
        casting_director_current_projects: audition.casting_director_current_projects || "",
        submission_deadline: toDatetimeLocalValue(audition.submission_deadline),
        actor_email: audition.actor_email || "",
        reminder_enabled: Boolean((audition as any).reminder_enabled),
      });
    }
  }, [audition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audition) return;

    // Clean up empty strings to null for optional fields
    const cleanedData: CreateAuditionData = {
      ...formData,
      casting_director: formData.casting_director || undefined,
      production_company: formData.production_company || undefined,
      audition_date: formData.audition_date || undefined,
      notes: formData.notes || undefined,
      contact_email: formData.contact_email || undefined,
      contact_phone: formData.contact_phone || undefined,
      contact_website: formData.contact_website || undefined,
      casting_director_preferences: formData.casting_director_preferences || undefined,
      casting_director_current_projects: formData.casting_director_current_projects || undefined,
      submission_deadline: toISOFromLocalInput(formData.submission_deadline),
      reminder_enabled: formData.reminder_enabled || undefined,
      reminder_time: formData.reminder_enabled ? calculateReminderTime() : undefined,
      actor_email: formData.actor_email || undefined,
    };

    try {
      await onUpdateAudition(audition.id, cleanedData);
      onClose();
    } catch (error) {
      console.error("Error updating audition:", error);
    }
  };

  const handleChange = (field: keyof CreateAuditionData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const sendTestEmail = async () => {
    if (!audition) return;
    try {
      setSendingTest(true);
      const to = user?.email;
      const { error } = await supabase.functions.invoke('send-audition-email', {
        body: {
          auditionId: audition.id,
          to,
          test: true,
        },
      });
      if (error) throw error as any;
      toast({ title: 'Test email sent', description: `Sent to ${to}` });
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setSendingTest(false);
    }
  };

  const sendManualEmail = async () => {
    if (!audition) return;
    try {
      if (!formData.actor_email) {
        toast({ title: 'Actor email required', description: 'Enter an actor email to send.', variant: 'destructive' });
        return;
      }
      setSendingEmail(true);
      const { error } = await supabase.functions.invoke('send-audition-email', {
        body: {
          auditionId: audition.id,
          to: formData.actor_email,
          test: false,
        },
      });
      if (error) throw error as any;
      toast({ title: 'Email sent', description: `Sent to ${formData.actor_email}` });
    } catch (err: any) {
      toast({ title: 'Email failed', description: err.message, variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Audition</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  placeholder="Audition title"
                />
              </div>

              <div>
                <Label htmlFor="casting_director">Casting Director</Label>
                <Input
                  id="casting_director"
                  value={formData.casting_director}
                  onChange={(e) => handleChange("casting_director", e.target.value)}
                  placeholder="Casting director name"
                />
              </div>

              <div>
                <Label htmlFor="production_company">Production Company</Label>
                <Input
                  id="production_company"
                  value={formData.production_company}
                  onChange={(e) => handleChange("production_company", e.target.value)}
                  placeholder="Production company name"
                />
              </div>

              <div>
                <Label htmlFor="audition_date">Audition Date</Label>
                <Input
                  id="audition_date"
                  type="date"
                  value={formData.audition_date}
                  onChange={(e) => handleChange("audition_date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="submission_deadline">Submission Deadline</Label>
                <Input
                  id="submission_deadline"
                  type="datetime-local"
                  value={formData.submission_deadline || ""}
                  onChange={(e) => handleChange("submission_deadline", e.target.value)}
                />
              </div>

              {/* Reminder Section */}
              <div className="space-y-3 p-4 border rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder_enabled"
                    checked={Boolean(formData.reminder_enabled)}
                    onCheckedChange={(checked) => handleChange("reminder_enabled", Boolean(checked))}
                  />
                  <Label htmlFor="reminder_enabled" className="text-sm font-medium">
                    Enable Email Reminders
                  </Label>
                </div>

                {formData.reminder_enabled && (
                  <div className="space-y-3 pl-6">
                    <Label className="text-sm">Reminder Timing</Label>
                    <RadioGroup value={reminderTiming} onValueChange={setReminderTiming} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1hour" id="1hour" />
                        <Label htmlFor="1hour" className="text-sm">1 hour before deadline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2hours" id="2hours" />
                        <Label htmlFor="2hours" className="text-sm">2 hours before deadline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4hours" id="4hours" />
                        <Label htmlFor="4hours" className="text-sm">4 hours before deadline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1day" id="1day" />
                        <Label htmlFor="1day" className="text-sm">1 day before deadline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2days" id="2days" />
                        <Label htmlFor="2days" className="text-sm">2 days before deadline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="text-sm">Custom time</Label>
                      </div>
                    </RadioGroup>

                    {reminderTiming === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="custom_reminder_time" className="text-sm">Custom Reminder Time</Label>
                        <Input
                          id="custom_reminder_time"
                          type="datetime-local"
                          value={customReminderTime}
                          onChange={(e) => setCustomReminderTime(e.target.value)}
                        />
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      We'll send you an email at the specified time before your submission deadline.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="audition_type">Audition Type</Label>
                <Select value={formData.audition_type} onValueChange={(value) => handleChange("audition_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self-tape">Self-Tape</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="callback">Callback</SelectItem>
                    <SelectItem value="chemistry-read">Chemistry Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparation">Preparation</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="callback">Callback</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="contact_website">Contact Website</Label>
                <Input
                  id="contact_website"
                  type="url"
                  value={formData.contact_website}
                  onChange={(e) => handleChange("contact_website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="actor_email">Actor Email (for manual send)</Label>
                <Input
                  id="actor_email"
                  type="email"
                  value={formData.actor_email || ""}
                  onChange={(e) => handleChange("actor_email", e.target.value)}
                  placeholder="actor@example.com"
                />
                <p className="text-sm text-muted-foreground mt-1">Use Send Test to email yourself, or Send Email to notify the actor.</p>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="secondary" onClick={sendTestEmail} disabled={sendingTest}>
                    {sendingTest ? 'Sending…' : 'Send Test'}
                  </Button>
                  <Button type="button" onClick={sendManualEmail} disabled={sendingEmail}>
                    {sendingEmail ? 'Sending…' : 'Send Email'}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="casting_director_preferences">Casting Director Preferences</Label>
                <Textarea
                  id="casting_director_preferences"
                  value={formData.casting_director_preferences}
                  onChange={(e) => handleChange("casting_director_preferences", e.target.value)}
                  placeholder="What does this casting director like and dislike? Acting styles, character types, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="casting_director_current_projects">Current Projects</Label>
                <Textarea
                  id="casting_director_current_projects"
                  value={formData.casting_director_current_projects}
                  onChange={(e) => handleChange("casting_director_current_projects", e.target.value)}
                  placeholder="What is this casting director currently working on? Shows, films, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this audition..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Audition</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAuditionDialog;
