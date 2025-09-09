
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreateAuditionData } from "@/types/audition";

interface CreateAuditionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAudition: (audition: CreateAuditionData) => void;
}

const CreateAuditionDialog = ({ isOpen, onClose, onCreateAudition }: CreateAuditionDialogProps) => {
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
    reminder_enabled: false,
  });

  const [reminderTiming, setReminderTiming] = useState<string>("1hour");
  const [customReminderTime, setCustomReminderTime] = useState<string>("");

  // Convert ISO to 'YYYY-MM-DDTHH:mm' for datetime-local inputs
  const toDatetimeLocalValue = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16);
  };

  // Convert local 'YYYY-MM-DDTHH:mm' to ISO for storage
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate reminder time if enabled
    if (formData.reminder_enabled && formData.submission_deadline) {
      const reminderTime = calculateReminderTime();
      if (!reminderTime) {
        alert("Please set a valid reminder time.");
        return;
      }
      
      const now = new Date();
      const reminderDate = new Date(reminderTime);
      
      if (reminderDate <= now) {
        alert("Reminder time must be in the future.");
        return;
      }
    }
    
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
    };

    console.log('Submitting audition data:', cleanedData);
    onCreateAudition(cleanedData);
    
    // Reset form
    setFormData({
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
      reminder_enabled: false,
    });
    setReminderTiming("1hour");
    setCustomReminderTime("");
  };

  const handleChange = (field: keyof CreateAuditionData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Audition</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Audition Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Lead Role - New Drama Series"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audition_type">Type</Label>
              <Select value={formData.audition_type} onValueChange={(value) => handleChange("audition_type", value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="self-tape">Self-tape</SelectItem>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="chemistry-read">Chemistry Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
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

          <div className="space-y-2">
            <Label htmlFor="casting_director">Casting Director</Label>
            <Input
              id="casting_director"
              value={formData.casting_director}
              onChange={(e) => handleChange("casting_director", e.target.value)}
              placeholder="e.g., Jane Smith"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="production_company">Production Company</Label>
            <Input
              id="production_company"
              value={formData.production_company}
              onChange={(e) => handleChange("production_company", e.target.value)}
              placeholder="e.g., ABC Studios"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              placeholder="contact@example.com"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange("contact_phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_website">Contact Website</Label>
            <Input
              id="contact_website"
              type="url"
              value={formData.contact_website}
              onChange={(e) => handleChange("contact_website", e.target.value)}
              placeholder="https://example.com"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audition_date">Audition Date</Label>
            <Input
              id="audition_date"
              type="date"
              value={formData.audition_date}
              onChange={(e) => handleChange("audition_date", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="casting_director_preferences">Casting Director Preferences</Label>
            <Textarea
              id="casting_director_preferences"
              value={formData.casting_director_preferences}
              onChange={(e) => handleChange("casting_director_preferences", e.target.value)}
              placeholder="What does this casting director like and dislike? Acting styles, character types, etc."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="casting_director_current_projects">Current Projects</Label>
            <Textarea
              id="casting_director_current_projects"
              value={formData.casting_director_current_projects}
              onChange={(e) => handleChange("casting_director_current_projects", e.target.value)}
              placeholder="What is this casting director currently working on? Shows, films, etc."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission_deadline">Submission Deadline</Label>
            <Input
              id="submission_deadline"
              type="datetime-local"
              value={formData.submission_deadline}
              onChange={(e) => handleChange("submission_deadline", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Reminder Section */}
          <div className="space-y-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(checked) => handleChange("reminder_enabled", Boolean(checked))}
                  className="border-gray-600 data-[state=checked]:bg-purple-600"
                />
                <Label htmlFor="reminder_enabled" className="text-sm font-medium">
                  Enable Email Reminders
                </Label>
              </div>
              
              {formData.reminder_enabled && (
                <div className="space-y-3 pl-6">
                  <Label className="text-sm text-gray-300">Reminder Timing</Label>
                  <RadioGroup value={reminderTiming} onValueChange={setReminderTiming} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1hour" id="1hour" className="border-gray-600 text-purple-600" />
                      <Label htmlFor="1hour" className="text-sm">1 hour before deadline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2hours" id="2hours" className="border-gray-600 text-purple-600" />
                      <Label htmlFor="2hours" className="text-sm">2 hours before deadline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4hours" id="4hours" className="border-gray-600 text-purple-600" />
                      <Label htmlFor="4hours" className="text-sm">4 hours before deadline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1day" id="1day" className="border-gray-600 text-purple-600" />
                      <Label htmlFor="1day" className="text-sm">1 day before deadline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2days" id="2days" className="border-gray-600 text-purple-600" />
                      <Label htmlFor="2days" className="text-sm">2 days before deadline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" className="border-gray-600 text-purple-600" />
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
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    We'll send you an email reminder at the specified time before your submission deadline.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this audition..."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create Audition
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuditionDialog;
