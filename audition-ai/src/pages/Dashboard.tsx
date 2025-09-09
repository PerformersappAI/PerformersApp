
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AuditionReportCard from "@/components/dashboard/AuditionReportCard";
import AuditionsList from "@/components/dashboard/AuditionsList";
import ScriptsList from "@/components/dashboard/ScriptsList";
import CreateAuditionDialog from "@/components/dashboard/CreateAuditionDialog";
import EditAuditionDialog from "@/components/dashboard/EditAuditionDialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Audition, AuditionStats, CreateAuditionData } from "@/types/audition";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAudition, setSelectedAudition] = useState<Audition | null>(null);

  // Fetch user's auditions
  const { data: auditions = [], isLoading: auditionsLoading, refetch: refetchAuditions } = useQuery({
    queryKey: ['auditions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching auditions for user:', user.id);
      
      const { data, error } = await supabase
        .from('auditions')
        .select(`
          *,
          scripts(title, content),
          video_submissions(id, video_title, evaluation_status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auditions:', error);
        throw error;
      }
      
      console.log('Fetched auditions:', data);
      return data as Audition[];
    },
    enabled: !!user,
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['audition-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.rpc('get_user_audition_stats', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data as unknown as AuditionStats;
    },
    enabled: !!user,
  });

  const handleCreateAudition = async (auditionData: CreateAuditionData) => {
    if (!user) return;

    try {
      console.log('Creating audition with data:', auditionData);
      
      // Clean the data before inserting
      const cleanedData = {
        title: auditionData.title,
        casting_director: auditionData.casting_director || null,
        production_company: auditionData.production_company || null,
        audition_date: auditionData.audition_date || null,
        audition_type: auditionData.audition_type || 'self-tape',
        status: auditionData.status || 'preparation',
        notes: auditionData.notes || null,
        script_id: auditionData.script_id || null,
        contact_email: auditionData.contact_email || null,
        contact_phone: auditionData.contact_phone || null,
        contact_website: auditionData.contact_website || null,
        submission_deadline: auditionData.submission_deadline || null,
        reminder_enabled: auditionData.reminder_enabled ?? false,
        reminder_time: auditionData.reminder_time || null,
        actor_email: auditionData.actor_email || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('auditions')
        .insert(cleanedData)
        .select()
        .single();

      if (error) {
        console.error('Error creating audition:', error);
        throw error;
      }

      console.log('Created audition:', data);
      
      // Send immediate confirmation email if a deadline is set and reminders are enabled
      try {
        if (cleanedData.submission_deadline && cleanedData.reminder_enabled) {
          const { error: emailError } = await supabase.functions.invoke('send-audition-email', {
            body: {
              auditionId: data.id,
              to: cleanedData.actor_email || user?.email || undefined,
              test: false,
            },
          });
          if (emailError) {
            console.warn('Immediate confirmation email failed:', emailError);
          } else {
            toast({ title: 'Email sent', description: 'Confirmation email sent.' });
          }
        }
      } catch (e) {
        console.warn('Immediate email exception:', e);
      }
      
      // Refetch auditions to show the new one
      await refetchAuditions();
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Audition created!",
        description: "Your new audition has been added to your dashboard.",
      });
    } catch (error: any) {
      console.error('Full error creating audition:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditAudition = (audition: Audition) => {
    setSelectedAudition(audition);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAudition = async (id: string, auditionData: CreateAuditionData) => {
    if (!user) return;

    try {
      const cleanedData = {
        title: auditionData.title,
        casting_director: auditionData.casting_director || null,
        production_company: auditionData.production_company || null,
        audition_date: auditionData.audition_date || null,
        audition_type: auditionData.audition_type || 'self-tape',
        status: auditionData.status || 'preparation',
        notes: auditionData.notes || null,
        contact_email: auditionData.contact_email || null,
        contact_phone: auditionData.contact_phone || null,
        contact_website: auditionData.contact_website || null,
        submission_deadline: auditionData.submission_deadline || null,
        reminder_enabled: auditionData.reminder_enabled ?? false,
        reminder_time: auditionData.reminder_time || null,
        actor_email: auditionData.actor_email || null,
      };

      const { error } = await supabase
        .from('auditions')
        .update(cleanedData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Send immediate confirmation email if a deadline is set and reminders are enabled
      try {
        if (cleanedData.submission_deadline && cleanedData.reminder_enabled) {
          const { error: emailError } = await supabase.functions.invoke('send-audition-email', {
            body: {
              auditionId: id,
              to: cleanedData.actor_email || user?.email || undefined,
              test: false,
            },
          });
          if (emailError) {
            console.warn('Immediate confirmation email (update) failed:', emailError);
          } else {
            toast({ title: 'Email sent', description: 'Confirmation email sent.' });
          }
        }
      } catch (e) {
        console.warn('Immediate email (update) exception:', e);
      }

      await refetchAuditions();
      setIsEditDialogOpen(false);
      setSelectedAudition(null);
      
      toast({
        title: "Audition updated!",
        description: "Your audition has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <DashboardHeader 
              userName={user?.user_metadata?.full_name || user?.email || 'Actor'}
              onCreateAudition={() => setIsCreateDialogOpen(true)}
            />

            <DashboardStats 
              stats={stats} 
              isLoading={statsLoading} 
            />

            <AuditionReportCard defaultEmail={user?.email || ''} />

            <Tabs defaultValue="auditions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                <TabsTrigger 
                  value="auditions" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
                >
                  Auditions
                </TabsTrigger>
                <TabsTrigger 
                  value="scripts" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
                >
                  Scripts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="auditions" className="mt-6">
                <AuditionsList 
                  auditions={auditions}
                  isLoading={auditionsLoading}
                  onRefetch={refetchAuditions}
                  onEditAudition={handleEditAudition}
                />
              </TabsContent>
              
              <TabsContent value="scripts" className="mt-6">
                <ScriptsList />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <CreateAuditionDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreateAudition={handleCreateAudition}
        />

        <EditAuditionDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedAudition(null);
          }}
          onUpdateAudition={handleUpdateAudition}
          audition={selectedAudition}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
