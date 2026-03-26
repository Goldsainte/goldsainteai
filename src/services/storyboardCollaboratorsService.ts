import { supabase } from "@/integrations/supabase/client";

export interface StoryboardCollaborator {
  id: string;
  storyboard_id: string;
  user_id: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
}

// Get collaborators for a storyboard
export async function getCollaborators(storyboardId: string): Promise<StoryboardCollaborator[]> {
  const { data, error } = await supabase
    .from("storyboard_collaborators")
    .select("*")
    .eq("storyboard_id", storyboardId);

  if (error) throw error;
  return (data || []) as StoryboardCollaborator[];
}

// Invite a collaborator
export async function inviteCollaborator(params: {
  storyboardId: string;
  userId: string;
  role?: string;
}): Promise<StoryboardCollaborator> {
  const { data, error } = await supabase
    .from("storyboard_collaborators")
    .insert({
      storyboard_id: params.storyboardId,
      user_id: params.userId,
      role: params.role || "viewer",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as StoryboardCollaborator;
}

// Accept collaboration invite
export async function acceptCollaboration(collaboratorId: string): Promise<void> {
  const { error } = await supabase
    .from("storyboard_collaborators")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", collaboratorId);

  if (error) throw error;
}

// Update collaborator role
export async function updateCollaboratorRole(
  collaboratorId: string,
  role: string
): Promise<void> {
  const { error } = await supabase
    .from("storyboard_collaborators")
    .update({ role })
    .eq("id", collaboratorId);

  if (error) throw error;
}

// Remove a collaborator
export async function removeCollaborator(collaboratorId: string): Promise<void> {
  const { error } = await supabase
    .from("storyboard_collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw error;
}

// Get storyboards where user is a collaborator
export async function getCollaboratingStoryboards(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("storyboard_collaborators")
    .select("storyboard_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((d) => d.storyboard_id);
}
