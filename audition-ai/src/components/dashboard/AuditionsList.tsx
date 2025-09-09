import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Audition } from "@/types/audition";
import { Search, Calendar, Building, User, FileText, Play, Mail, Phone, Globe, Edit3, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AuditionsListProps {
  auditions: Audition[];
  isLoading: boolean;
  onRefetch: () => void;
  onEditAudition: (audition: Audition) => void;
}

const AuditionsList = ({ auditions, isLoading, onRefetch, onEditAudition }: AuditionsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingAuditionId, setDeletingAuditionId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparation': return 'bg-yellow-600';
      case 'submitted': return 'bg-blue-600';
      case 'callback': return 'bg-orange-600';
      case 'booked': return 'bg-green-600';
      case 'rejected': return 'bg-red-600';
      case 'expired': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (auditionId: string) => {
      const { error } = await supabase
        .from('auditions')
        .delete()
        .eq('id', auditionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditions', user?.id] });
      onRefetch();
      toast({
        title: "Audition deleted",
        description: "Audition has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting audition:', error);
      toast({
        title: "Error deleting audition",
        description: "Failed to delete audition. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingAuditionId(null);
    },
  });

  const handleDeleteAudition = (auditionId: string) => {
    setDeletingAuditionId(auditionId);
    deleteMutation.mutate(auditionId);
  };

  const filteredAuditions = auditions.filter(audition => {
    const matchesSearch = audition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audition.casting_director?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audition.production_company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || audition.status === statusFilter;
    const matchesType = typeFilter === 'all' || audition.audition_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 w-40 bg-gray-700" />
          <Skeleton className="h-10 w-40 bg-gray-700" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-gray-700" />
              <Skeleton className="h-4 w-32 bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search auditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="preparation">Preparation</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="callback">Callback</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="self-tape">Self-tape</SelectItem>
            <SelectItem value="in-person">In-person</SelectItem>
            <SelectItem value="callback">Callback</SelectItem>
            <SelectItem value="chemistry-read">Chemistry Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAuditions.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No auditions found</h3>
            <p className="text-gray-500 text-center">
              {auditions.length === 0 
                ? "Start your journey by creating your first audition."
                : "Try adjusting your search filters to find what you're looking for."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAuditions.map((audition) => (
            <Card key={audition.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl mb-2">{audition.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                      {audition.casting_director && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {audition.casting_director}
                        </div>
                      )}
                      {audition.production_company && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {audition.production_company}
                        </div>
                      )}
                      {audition.audition_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(audition.audition_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {audition.submission_deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {format(new Date(audition.submission_deadline), 'MMM dd, yyyy p')}
                        </div>
                      )}
                      {audition.contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {audition.contact_email}
                        </div>
                      )}
                      {audition.contact_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {audition.contact_phone}
                        </div>
                      )}
                      {audition.contact_website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span className="truncate max-w-32">{audition.contact_website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${getStatusColor(audition.status)} text-white`}>
                      {audition.status}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {audition.audition_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {audition.notes && (
                    <p className="text-gray-300">{audition.notes}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {audition.scripts && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <FileText className="h-4 w-4" />
                        Script: {audition.scripts.title}
                      </div>
                    )}
                    {audition.script_analyses && audition.script_analyses.length > 0 && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Play className="h-4 w-4" />
                        Character: {audition.script_analyses[0].selected_character}
                      </div>
                    )}
                    {audition.video_submissions && audition.video_submissions.length > 0 && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Play className="h-4 w-4" />
                        {audition.video_submissions.length} video{audition.video_submissions.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      Created {format(new Date(audition.created_at), 'MMM dd, yyyy')}
                    </span>
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            disabled={deletingAuditionId === audition.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Audition</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{audition.title}"? This action cannot be undone and will also delete any related video submissions and coaching sessions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAudition(audition.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Audition
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => onEditAudition(audition)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditionsList;
