
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Coach {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  highlights: string[];
  photo_url: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminCoachesManager = () => {
  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coaches, isLoading } = useQuery({
    queryKey: ['admin-coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Coach[];
    },
  });

  const deleteCoachMutation = useMutation({
    mutationFn: async (coachId: string) => {
      const { error } = await supabase
        .from('coaches')
        .delete()
        .eq('id', coachId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coaches'] });
      toast({
        title: "Coach deleted",
        description: "The coach has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting coach",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Coaches</h2>
        <Dialog open={isAddingCoach} onOpenChange={setIsAddingCoach}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Coach
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Coach</DialogTitle>
            </DialogHeader>
            <CoachForm 
              onSuccess={() => setIsAddingCoach(false)} 
              onCancel={() => setIsAddingCoach(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coaches?.map((coach) => (
          <Card key={coach.id} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {coach.photo_url && (
                    <img
                      src={coach.photo_url}
                      alt={coach.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
                    />
                  )}
                  <div>
                    <CardTitle className="text-white text-lg">{coach.name}</CardTitle>
                    <p className="text-sm text-gray-400">/{coach.slug}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={coach.active} disabled />
                  <span className="text-xs text-gray-400">
                    {coach.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {coach.bio && (
                <p className="text-gray-300 text-sm line-clamp-2">{coach.bio}</p>
              )}
              
              {coach.email && (
                <p className="text-purple-400 text-sm">{coach.email}</p>
              )}
              
              {coach.highlights.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {coach.highlights.length} highlight{coach.highlights.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {coach.highlights.slice(0, 2).map((_, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        Highlight {index + 1}
                      </Badge>
                    ))}
                    {coach.highlights.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{coach.highlights.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Dialog open={editingCoach?.id === coach.id} onOpenChange={(open) => setEditingCoach(open ? coach : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white">Edit Coach</DialogTitle>
                    </DialogHeader>
                    <CoachForm 
                      coach={coach}
                      onSuccess={() => setEditingCoach(null)} 
                      onCancel={() => setEditingCoach(null)}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Coach</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete {coach.name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteCoachMutation.mutate(coach.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface CoachFormProps {
  coach?: Coach;
  onSuccess: () => void;
  onCancel: () => void;
}

const CoachForm = ({ coach, onSuccess, onCancel }: CoachFormProps) => {
  const [formData, setFormData] = useState({
    name: coach?.name || '',
    slug: coach?.slug || '',
    bio: coach?.bio || '',
    email: coach?.email || '',
    photo_url: coach?.photo_url || '',
    active: coach?.active ?? true,
    highlights: coach?.highlights || ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === index ? value : h)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanedHighlights = formData.highlights.filter(h => h.trim() !== '');
      
      const coachData = {
        ...formData,
        highlights: cleanedHighlights,
        photo_url: formData.photo_url || null,
        email: formData.email || null,
        bio: formData.bio || null
      };

      if (coach) {
        const { error } = await supabase
          .from('coaches')
          .update(coachData)
          .eq('id', coach.id);
        
        if (error) throw error;
        
        toast({
          title: "Coach updated",
          description: "The coach has been successfully updated.",
        });
      } else {
        const { error } = await supabase
          .from('coaches')
          .insert(coachData);
        
        if (error) throw error;
        
        toast({
          title: "Coach added",
          description: "The new coach has been successfully added.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['admin-coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      onSuccess();
    } catch (error: any) {
      toast({
        title: coach ? "Error updating coach" : "Error adding coach",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-white">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="slug" className="text-white">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            required
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>

      <div>
        <Label htmlFor="photo_url" className="text-white">Photo URL</Label>
        <Input
          id="photo_url"
          value={formData.photo_url}
          onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
          className="bg-gray-800 border-gray-600 text-white"
          placeholder="https://example.com/photo.jpg or /lovable-uploads/..."
        />
      </div>

      <div>
        <Label htmlFor="bio" className="text-white">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-white">Highlights</Label>
          <Button type="button" onClick={addHighlight} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                placeholder={`Highlight ${index + 1}`}
                className="bg-gray-800 border-gray-600 text-white flex-1"
              />
              {formData.highlights.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  size="sm"
                  variant="destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label className="text-white">Active</Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {coach ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            coach ? 'Update Coach' : 'Add Coach'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AdminCoachesManager;
