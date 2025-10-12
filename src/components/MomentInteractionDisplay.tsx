import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, EyeOff } from 'lucide-react';

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

  useEffect(() => {
    fetchUserResponse();
    fetchResponseStats();
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
    const [showResult, setShowResult] = useState(false);

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
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const calculateTimeLeft = () => {
        const end = new Date(interaction.data.endTime).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft('Time is up!');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }, [interaction.data.endTime]);

    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-6 text-center">
        <p className="text-white/70 text-sm mb-2">{interaction.data.label}</p>
        <p className="text-white text-3xl font-bold">{timeLeft}</p>
      </div>
    );
  }

  if (interaction.type === 'slider') {
    const [sliderValue, setSliderValue] = useState(
      userResponse?.value || Math.round((interaction.data.min + interaction.data.max) / 2)
    );

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

  if (interaction.type === 'add_yours') {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-white font-medium">{interaction.data.prompt}</p>
          <Button
            size="sm"
            onClick={() => toast.info('Add Yours feature coming soon!')}
            className="bg-primary hover:bg-primary/90"
          >
            Add Yours
          </Button>
        </div>
      </div>
    );
  }

  return null;
};