
import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow, subDays } from "date-fns";
import { Trash2, RotateCcw, Ban, Filter } from "lucide-react";

type AdminScript = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  genre?: string | null;
  deleted_at?: string | null;
};

type StatusFilter = "active" | "trashed" | "all";

const AdminScriptsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin detection
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
    meta: {
      onError: (err: unknown) => {
        console.error("Admin check failed:", err);
      },
    },
  });

  // Filters
  const [daysOld, setDaysOld] = useState<number>(90);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [search, setSearch] = useState<string>("");

  const thresholdISO = useMemo(() => subDays(new Date(), daysOld).toISOString(), [daysOld]);

  // Fetch scripts (admin scope)
  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["admin-scripts", { status, thresholdISO, search }],
    enabled: !!isAdmin,
    queryFn: async () => {
      let query = supabase
        .from("scripts")
        .select("id, user_id, title, content, created_at, updated_at, genre, deleted_at")
        .order("updated_at", { ascending: false });

      if (status === "active") {
        query = query.is("deleted_at", null);
      } else if (status === "trashed") {
        query = query.not("deleted_at", "is", null);
      }
      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminScript[];
    },
    meta: {
      onError: (err: unknown) => {
        console.error("Error fetching admin scripts:", err);
        toast({
          variant: "destructive",
          title: "Failed to load scripts",
          description: "Please try again.",
        });
      },
    },
  });

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const clearSelection = () => setSelected({});

  // Mutations
  const trashSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("scripts")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scripts"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Moved to Trash", description: "Selected scripts were moved to trash." });
      clearSelection();
    },
    onError: (error) => {
      console.error("Trash selected error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not trash selected scripts." });
    },
  });

  const restoreSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("scripts").update({ deleted_at: null }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scripts"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Restored", description: "Selected scripts were restored." });
      clearSelection();
    },
    onError: (error) => {
      console.error("Restore selected error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not restore selected scripts." });
    },
  });

  const deleteForeverMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("scripts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scripts"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Deleted Forever", description: "Selected scripts were permanently deleted." });
      clearSelection();
    },
    onError: (error) => {
      console.error("Delete forever error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete selected scripts." });
    },
  });

  const trashOlderThanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("scripts")
        .update({ deleted_at: new Date().toISOString() })
        .lt("updated_at", thresholdISO)
        .is("deleted_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scripts"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Old Scripts Trashed", description: `All active scripts older than ${daysOld} days were moved to trash.` });
      clearSelection();
    },
    onError: (error) => {
      console.error("Trash older-than error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not trash old scripts." });
    },
  });

  if (!isAdmin) return null;

  const allSelected = scripts.length > 0 && selectedIds.length === scripts.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      const next: Record<string, boolean> = {};
      scripts.forEach((s) => (next[s.id] = true));
      setSelected(next);
    }
  };

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">Admin: Scripts Manager</CardTitle>
            <Badge variant={status === "trashed" ? "destructive" : "secondary"}>
              {status === "active" ? "Active" : status === "trashed" ? "Trashed" : "All"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus((s) => (s === "active" ? "trashed" : s === "trashed" ? "all" : "active"))}
              className="gap-2"
              title="Cycle status filter"
            >
              <Filter className="w-4 h-4" />
              {status === "active" ? "Show: Trashed" : status === "trashed" ? "Show: All" : "Show: Active"}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Older than</span>
              <Input
                type="number"
                className="w-20"
                min={1}
                value={daysOld}
                onChange={(e) => setDaysOld(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="text-sm text-muted-foreground">days</span>
              <Button
                size="sm"
                disabled={trashOlderThanMutation.isPending}
                onClick={() => trashOlderThanMutation.mutate()}
                className="ml-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Trash older than {daysOld}d
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Badge variant="outline">Results: {scripts.length}</Badge>
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              Selected: {selectedIds.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            disabled={scripts.length === 0}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </Button>

          <Button
            size="sm"
            variant="default"
            disabled={selectedIds.length === 0 || trashSelectedMutation.isPending}
            onClick={() => trashSelectedMutation.mutate(selectedIds)}
            className="gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Trash Selected
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={selectedIds.length === 0 || restoreSelectedMutation.isPending}
            onClick={() => restoreSelectedMutation.mutate(selectedIds)}
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Selected
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                disabled={selectedIds.length === 0 || deleteForeverMutation.isPending}
                className="gap-1"
              >
                <Ban className="w-4 h-4" />
                Delete Forever
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete forever?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedIds.length} script(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteForeverMutation.mutate(selectedIds)}>
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={6}>
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : scripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No scripts found for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                scripts.map((s) => {
                  const isTrashed = Boolean(s.deleted_at);
                  const ageStr = formatDistanceToNow(new Date(s.updated_at), { addSuffix: true });
                  return (
                    <TableRow key={s.id} className={isTrashed ? "opacity-70" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={!!selected[s.id]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))
                          }
                          aria-label={`Select ${s.title}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-[340px]">
                        <div className="font-medium truncate">{s.title || "Untitled"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.genre ? `Genre: ${s.genre}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isTrashed ? (
                          <Badge variant="destructive">Trashed</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(s.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{ageStr}</TableCell>
                      <TableCell>{s.content?.length ?? 0}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminScriptsManager;
