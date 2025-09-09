import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, Star, Phone, Globe, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Photographer {
  id: string;
  name: string;
  business_name?: string;
  email: string;
  phone?: string;
  website?: string;
  instagram?: string;
  city: string;
  state: string;
  country: string;
  specialties: string[];
  price_range?: string;
  portfolio_url?: string;
  bio?: string;
  rating?: number;
  total_reviews: number;
  verified: boolean;
  active: boolean;
}

const emptyPhotographer: Partial<Photographer> = {
  name: '',
  business_name: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
  city: '',
  state: '',
  country: 'United States',
  specialties: [],
  price_range: '',
  portfolio_url: '',
  bio: '',
  rating: undefined,
  total_reviews: 0,
  verified: false,
  active: true,
};

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhotographer, setEditingPhotographer] = useState<Partial<Photographer>>(emptyPhotographer);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotographers();
  }, []);

  const fetchPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .from('photographers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotographers(data || []);
    } catch (error) {
      console.error('Error fetching photographers:', error);
      toast({
        title: "Error",
        description: "Failed to load photographers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editingPhotographer.name || !editingPhotographer.email || 
          !editingPhotographer.city || !editingPhotographer.state) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Email, City, State)",
          variant: "destructive",
        });
        return;
      }

      const photographerData = {
        ...editingPhotographer,
        name: editingPhotographer.name!,
        email: editingPhotographer.email!,
        city: editingPhotographer.city!,
        state: editingPhotographer.state!,
        country: editingPhotographer.country || 'United States',
        specialties: editingPhotographer.specialties || [],
        rating: editingPhotographer.rating || null,
        total_reviews: editingPhotographer.total_reviews || 0,
        verified: editingPhotographer.verified || false,
        active: editingPhotographer.active !== false,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('photographers')
          .update(photographerData)
          .eq('id', editingPhotographer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photographers')
          .insert(photographerData);
        if (error) throw error;
      }

      await fetchPhotographers();
      setDialogOpen(false);
      setEditingPhotographer(emptyPhotographer);
      setIsEditing(false);

      toast({
        title: "Success",
        description: `Photographer ${isEditing ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving photographer:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} photographer`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photographer?')) return;

    try {
      const { error } = await supabase
        .from('photographers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPhotographers();
      toast({
        title: "Success",
        description: "Photographer deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting photographer:', error);
      toast({
        title: "Error",
        description: "Failed to delete photographer",
        variant: "destructive",
      });
    }
  };

  const openDialog = (photographer?: Photographer) => {
    if (photographer) {
      setEditingPhotographer(photographer);
      setIsEditing(true);
    } else {
      setEditingPhotographer(emptyPhotographer);
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleSpecialtiesChange = (value: string) => {
    const specialties = value.split(',').map(s => s.trim()).filter(s => s);
    setEditingPhotographer(prev => ({ ...prev, specialties }));
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">No rating</span>;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Photographer Management</h1>
            <p className="text-muted-foreground">Manage headshot photographers directory</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Photographer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Edit Photographer' : 'Add New Photographer'}
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update photographer information' : 'Add a new photographer to the directory'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={editingPhotographer.name || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={editingPhotographer.business_name || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, business_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingPhotographer.email || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingPhotographer.phone || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={editingPhotographer.city || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={editingPhotographer.state || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editingPhotographer.country || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={editingPhotographer.website || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={editingPhotographer.instagram || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, instagram: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Input
                    id="specialties"
                    value={editingPhotographer.specialties?.join(', ') || ''}
                    onChange={(e) => handleSpecialtiesChange(e.target.value)}
                    placeholder="headshots, commercial, theatrical, corporate"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_range">Price Range</Label>
                    <Input
                      id="price_range"
                      value={editingPhotographer.price_range || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ ...prev, price_range: e.target.value }))}
                      placeholder="$300-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={editingPhotographer.rating || ''}
                      onChange={(e) => setEditingPhotographer(prev => ({ 
                        ...prev, 
                        rating: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editingPhotographer.bio || ''}
                    onChange={(e) => setEditingPhotographer(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="verified"
                    checked={editingPhotographer.verified || false}
                    onCheckedChange={(checked) => setEditingPhotographer(prev => ({ ...prev, verified: checked }))}
                  />
                  <Label htmlFor="verified">Verified Photographer</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={editingPhotographer.active !== false}
                    onCheckedChange={(checked) => setEditingPhotographer(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Active (visible to users)</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {isEditing ? 'Update' : 'Create'} Photographer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {photographers.map((photographer) => (
            <Card key={photographer.id} className={`${!photographer.active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle>{photographer.name}</CardTitle>
                      {photographer.verified && (
                        <Badge variant="default">Verified</Badge>
                      )}
                      {!photographer.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {photographer.business_name && (
                      <CardDescription>{photographer.business_name}</CardDescription>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {photographer.city}, {photographer.state}
                    </div>
                    {renderStarRating(photographer.rating)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(photographer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(photographer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {photographer.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                {photographer.price_range && (
                  <p className="text-sm font-medium">Price: {photographer.price_range}</p>
                )}

                {photographer.bio && (
                  <p className="text-sm text-muted-foreground">{photographer.bio}</p>
                )}

                <Separator />

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{photographer.email}</span>
                  {photographer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {photographer.phone}
                    </div>
                  )}
                  {photographer.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <a href={photographer.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                  {photographer.instagram && (
                    <div className="flex items-center gap-1">
                      <Instagram className="h-3 w-3" />
                      <a href={photographer.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Instagram
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {photographers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No photographers found.</p>
                <Button className="mt-4" onClick={() => openDialog()}>
                  Add First Photographer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}