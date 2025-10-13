import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, EyeOff, Plus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface InteractionData {
  type: 'poll' | 'question' | 'quiz' | 'countdown' | 'slider' | 'add_yours';
  data: any;
}

interface MomentInteractionDisplayProps {
  momentId: string;
  interaction: InteractionData;
}

export const MomentInteractionDisplay = ({ momentId, interaction }: MomentInteractionDisplayProps) => {
  const [userResponse, setUserResponse] = useState<any>(null);
  const [responseStats, setResponseStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  
  // State for quiz type
  const [showResult, setShowResult] = useState(false);
  
  // State for countdown type
  const [timeLeft, setTimeLeft] = useState('');
  
  // State for slider type
  const [sliderValue, setSliderValue] = useState(
    userResponse?.value || (interaction.data?.min && interaction.data?.max ? Math.round((interaction.data.min + interaction.data.max) / 2) : 50)
  );

  // State for add_yours type
  const [showAddYoursDialog, setShowAddYoursDialog] = useState(false);
  const [showAddYoursResponses, setShowAddYoursResponses] = useState(false);
  const [addYoursResponses, setAddYoursResponses] = useState<any[]>([]);
  const [uploadingAddYours, setUploadingAddYours] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchUserResponse();
    fetchResponseStats();
    if (interaction.type === 'add_yours') {
      fetchAddYoursResponses();
    }
  }, [momentId, interaction.type]);

  const fetchUserResponse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('moment_interaction_responses')
        .select('response_data')
        .eq('moment_id', momentId)
        .eq('user_id', user.id)
        .eq('interaction_type', interaction.type)
        .maybeSingle();

      if (data) {
        setUserResponse(data.response_data);
        if (interaction.type !== 'question' && interaction.type !== 'add_yours') {
          setRevealed(true);
        }
      }
    } catch (error) {
      console.error('Error fetching response:', error);
    }
  };

  const fetchResponseStats = async () => {
    try {
      const { data } = await supabase
        .from('moment_interaction_responses')
        .select('response_data')
        .eq('moment_id', momentId)
        .eq('interaction_type', interaction.type);

      if (data) {
        const stats: any = {};

        if (interaction.type === 'poll') {
          stats.votes = {};
          interaction.data.options.forEach((option: string) => {
            stats.votes[option] = 0;
          });
          data.forEach(response => {
            const responseData = response.response_data as any;
            if (responseData.answer) {
              stats.votes[responseData.answer] = (stats.votes[responseData.answer] || 0) + 1;
            }
          });
          stats.totalVotes = data.length;
        } else if (interaction.type === 'quiz') {
          stats.totalResponses = data.length;
          stats.correctResponses = data.filter(r => (r.response_data as any).correct).length;
        } else if (interaction.type === 'slider') {
          if (data.length > 0) {
            const sum = data.reduce((acc, r) => acc + ((r.response_data as any).value || 0), 0);
            stats.average = Math.round(sum / data.length);
          }
        }

        setResponseStats(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const submitResponse = async (response: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('moment_interaction_responses')
        .insert({
          moment_id: momentId,
          user_id: user.id,
          interaction_type: interaction.type,
          response_data: response,
        });

      if (error) throw error;

      setUserResponse(response);
      if (interaction.type !== 'question' && interaction.type !== 'add_yours') {
        setRevealed(true);
      }
      await fetchResponseStats();
      toast.success('Response submitted!');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info('You already responded to this');
      } else {
        toast.error('Failed to submit response');
      }
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (interaction.type !== 'countdown') return;

    const calculateTimeLeft = () => {
      const end = new Date(interaction.data?.endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (Number.isNaN(end)) {
        setTimeLeft('');
        return;
      }

      if (diff <= 0) {
        setTimeLeft('Time is up!');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [interaction.type, interaction.data?.endTime]);

  if (interaction.type === 'poll') {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4 space-y-3">
        <p className="text-white font-medium">{interaction.data.question}</p>
        <div className="space-y-2">
          {interaction.data.options.map((option: string) => {
            const votes = responseStats?.votes?.[option] || 0;
            const totalVotes = responseStats?.totalVotes || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = userResponse?.answer === option;

            return (
              <button
                key={option}
                onClick={() => !userResponse && submitResponse({ answer: option })}
                disabled={!!userResponse || loading}
                className={`w-full relative rounded-xl p-3 text-left transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                } ${userResponse ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {revealed && (
                  <div
                    className="absolute inset-0 bg-primary/30 rounded-xl transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {revealed && <span className="text-sm">{percentage}%</span>}
                </div>
              </button>
            );
          })}
        </div>
        {revealed && (
          <p className="text-white/70 text-xs text-center">
            {responseStats?.totalVotes || 0} votes
          </p>
        )}
      </div>
    );
  }

  if (interaction.type === 'question') {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4 space-y-3">
        <p className="text-white font-medium">{interaction.data.text}</p>
        {!userResponse ? (
          <div className="flex gap-2">
            <Input
              placeholder="Type your answer..."
              className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  submitResponse({ answer: e.currentTarget.value });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        ) : (
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-white text-sm">Your answer: {userResponse.answer}</p>
          </div>
        )}
      </div>
    );
  }

  if (interaction.type === 'quiz') {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4 space-y-3">
        <p className="text-white font-medium">{interaction.data.question}</p>
        <div className="space-y-2">
          {interaction.data.options.map((option: string, index: number) => {
            const isCorrect = index === interaction.data.correctAnswer;
            const isSelected = userResponse?.answerIndex === index;

            return (
              <button
                key={option}
                onClick={() => {
                  if (!userResponse) {
                    submitResponse({ answerIndex: index, correct: isCorrect });
                    setShowResult(true);
                  }
                }}
                disabled={!!userResponse || loading}
                className={`w-full rounded-xl p-3 text-left transition-all flex items-center justify-between ${
                  showResult && isCorrect
                    ? 'bg-green-500/80 text-white'
                    : showResult && isSelected && !isCorrect
                    ? 'bg-red-500/80 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <span className="font-medium">{option}</span>
                {showResult && isCorrect && <Check className="w-5 h-5" />}
                {showResult && isSelected && !isCorrect && <X className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
        {showResult && responseStats && (
          <p className="text-white/70 text-xs text-center">
            {responseStats.correctResponses} of {responseStats.totalResponses} got it right
          </p>
        )}
      </div>
    );
  }

  if (interaction.type === 'countdown') {
 
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
        <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-6 text-center max-w-[80%]">
          <p className="text-white/70 text-sm mb-2">{interaction.data.label}</p>
          <p className="text-white text-3xl font-bold">{timeLeft}</p>
        </div>
      </div>
    );
  }

  if (interaction.type === 'slider') {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4 space-y-3">
        <p className="text-white font-medium">{interaction.data.question}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">{interaction.data.min}</span>
            <span className="text-white text-2xl">{interaction.data.emoji}</span>
            <span className="text-white/70 text-sm">{interaction.data.max}</span>
          </div>
          {!userResponse ? (
            <>
              <Slider
                value={[sliderValue]}
                onValueChange={(v) => setSliderValue(v[0])}
                min={interaction.data.min}
                max={interaction.data.max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <span className="text-white text-lg font-bold">{sliderValue}</span>
                <Button
                  size="sm"
                  onClick={() => submitResponse({ value: sliderValue })}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  Submit
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Progress value={((userResponse.value - interaction.data.min) / (interaction.data.max - interaction.data.min)) * 100} className="h-2" />
              <div className="flex justify-between text-white text-sm">
                <span>Your rating: {userResponse.value}</span>
                {responseStats?.average && (
                  <span>Average: {responseStats.average}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const fetchAddYoursResponses = async () => {
    try {
      const { data } = await supabase
        .from('moment_interaction_responses')
        .select(`
          response_data,
          created_at,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('moment_id', momentId)
        .eq('interaction_type', 'add_yours')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setAddYoursResponses(data);
      }
    } catch (error) {
      console.error('Error fetching add yours responses:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAddYoursSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploadingAddYours(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `add-yours/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('moments')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(filePath);

      // Submit response
      await submitResponse({
        mediaUrl: publicUrl,
        mediaType: selectedFile.type.startsWith('image/') ? 'image' : 'video',
      });

      setShowAddYoursDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchAddYoursResponses();
      toast.success('Your response has been shared!');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to share response');
    } finally {
      setUploadingAddYours(false);
    }
  };

  if (interaction.type === 'add_yours') {
    const responseCount = addYoursResponses.length;
    
    return (
      <>
        <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4">
          <div className="space-y-3">
            <p className="text-white font-medium">{interaction.data.prompt}</p>
            <div className="flex gap-2">
              {!userResponse ? (
                <Button
                  size="sm"
                  onClick={() => setShowAddYoursDialog(true)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Yours
                </Button>
              ) : (
                <div className="flex-1 bg-white/20 rounded-lg p-2 text-white text-sm text-center">
                  ✓ You've shared your response
                </div>
              )}
              {responseCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddYoursResponses(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Users className="w-4 h-4 mr-1" />
                  {responseCount}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add Yours Upload Dialog */}
        <Dialog open={showAddYoursDialog} onOpenChange={setShowAddYoursDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Your Response</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Photo or Video</Label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={uploadingAddYours}
                />
              </div>
              
              {previewUrl && (
                <div className="rounded-lg overflow-hidden bg-muted">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-auto" />
                  ) : (
                    <video src={previewUrl} className="w-full h-auto" controls />
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddYoursDialog(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1"
                  disabled={uploadingAddYours}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddYoursSubmit}
                  className="flex-1"
                  disabled={!selectedFile || uploadingAddYours}
                >
                  {uploadingAddYours ? 'Sharing...' : 'Share'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Responses Dialog */}
        <Dialog open={showAddYoursResponses} onOpenChange={setShowAddYoursResponses}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Responses ({responseCount})</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {addYoursResponses.map((response: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="rounded-lg overflow-hidden bg-muted aspect-square">
                    {response.response_data.mediaType === 'image' ? (
                      <img
                        src={response.response_data.mediaUrl}
                        alt="Response"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={response.response_data.mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={response.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.profiles?.id}`}
                      alt={response.profiles?.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">
                      @{response.profiles?.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
};