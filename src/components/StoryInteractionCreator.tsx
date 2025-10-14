import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, MessageCircleQuestion, ListChecks, Timer, Sliders, Plus } from 'lucide-react';

interface InteractionData {
  type: 'poll' | 'question' | 'quiz' | 'countdown' | 'slider' | 'add_yours';
  data: any;
}

interface StoryInteractionCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (interaction: InteractionData) => void;
  embedded?: boolean;
}

export const StoryInteractionCreator = ({
  open,
  onOpenChange,
  onSave,
  embedded = false,
}: StoryInteractionCreatorProps) => {
  const [interactionType, setInteractionType] = useState<InteractionData['type']>('poll');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [questionText, setQuestionText] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('');
  const [sliderEmoji, setSliderEmoji] = useState('😍');
  const [sliderShowLabels, setSliderShowLabels] = useState(true);
  const [sliderLowLabel, setSliderLowLabel] = useState('Low');
  const [sliderHighLabel, setSliderHighLabel] = useState('High');
  const [addYoursPrompt, setAddYoursPrompt] = useState('');

  const quickEmojis = ['😍', '🔥', '😊', '👍', '🌟', '😎', '🥳', '❤️', '⭐', '💯'];

  const handleSave = () => {
    let data: any = {};

    switch (interactionType) {
      case 'poll':
        data = {
          question: pollQuestion,
          options: pollOptions.filter(o => o.trim()),
        };
        break;
      case 'question':
        data = {
          text: questionText,
        };
        break;
      case 'quiz':
        data = {
          question: quizQuestion,
          options: quizOptions.filter(o => o.trim()),
          correctAnswer,
        };
        break;
      case 'countdown':
        data = {
          label: countdownLabel,
          endTime: new Date(countdownDate).toISOString(),
        };
        break;
      case 'slider':
        data = {
          emoji: sliderEmoji,
          showLabels: sliderShowLabels,
          lowLabel: sliderShowLabels ? sliderLowLabel : undefined,
          highLabel: sliderShowLabels ? sliderHighLabel : undefined,
        };
        break;
      case 'add_yours':
        data = {
          prompt: addYoursPrompt,
        };
        break;
    }

    onSave({ type: interactionType, data });
    onOpenChange(false);
  };

  const renderForm = () => {
    switch (interactionType) {
      case 'poll':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            {pollOptions.map((option, i) => (
              <div key={i} className="space-y-2">
                <Label>Option {i + 1}</Label>
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[i] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                />
              </div>
            ))}
            {pollOptions.length < 4 && (
              <Button
                variant="outline"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="w-full"
              >
                Add Option
              </Button>
            )}
          </div>
        );

      case 'question':
        return (
          <div className="space-y-2">
            <Label>Question Prompt</Label>
            <Input
              placeholder="Ask me a question..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quiz Question</Label>
              <Input
                placeholder="Ask a quiz question..."
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
              />
            </div>
            {quizOptions.map((option, i) => (
              <div key={i} className="space-y-2">
                <Label className="flex items-center justify-between">
                  Option {i + 1}
                  {i === correctAnswer && (
                    <span className="text-xs text-green-500">✓ Correct</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...quizOptions];
                      newOptions[i] = e.target.value;
                      setQuizOptions(newOptions);
                    }}
                  />
                  <Button
                    variant={i === correctAnswer ? 'default' : 'outline'}
                    onClick={() => setCorrectAnswer(i)}
                    className="px-3"
                  >
                    ✓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Countdown Label</Label>
              <Input
                placeholder="e.g., Trip to Paris"
                value={countdownLabel}
                onChange={(e) => setCountdownLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={countdownDate}
                onChange={(e) => setCountdownDate(e.target.value)}
              />
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {quickEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={sliderEmoji === emoji ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSliderEmoji(emoji)}
                    className="text-xl w-10 h-10 p-0"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Or type your own emoji"
                value={sliderEmoji}
                onChange={(e) => setSliderEmoji(e.target.value)}
                maxLength={2}
                className="text-center text-xl"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Show Labels</Label>
                <Button
                  type="button"
                  variant={sliderShowLabels ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSliderShowLabels(!sliderShowLabels)}
                >
                  {sliderShowLabels ? "On" : "Off"}
                </Button>
              </div>
              {sliderShowLabels && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Low Label</Label>
                    <Input
                      placeholder="Low"
                      value={sliderLowLabel}
                      onChange={(e) => setSliderLowLabel(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">High Label</Label>
                    <Input
                      placeholder="High"
                      value={sliderHighLabel}
                      onChange={(e) => setSliderHighLabel(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                {sliderShowLabels && <span className="text-xs">{sliderLowLabel}</span>}
                <div className="flex-1 h-1 bg-border rounded-full relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
                    {sliderEmoji}
                  </div>
                </div>
                {sliderShowLabels && <span className="text-xs">{sliderHighLabel}</span>}
              </div>
            </div>
          </div>
        );

      case 'add_yours':
        return (
          <div className="space-y-2">
            <Label>Add Yours Prompt</Label>
            <Input
              placeholder="e.g., Show us your travel style..."
              value={addYoursPrompt}
              onChange={(e) => setAddYoursPrompt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Other users can respond with their own photos/videos
            </p>
          </div>
        );
    }
  };

  const innerContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Interaction Type</Label>
        <Select value={interactionType} onValueChange={(v: any) => setInteractionType(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="poll">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Poll
              </div>
            </SelectItem>
            <SelectItem value="question">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="h-4 w-4" />
                Question
              </div>
            </SelectItem>
            <SelectItem value="quiz">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Quiz
              </div>
            </SelectItem>
            <SelectItem value="countdown">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Countdown
              </div>
            </SelectItem>
            <SelectItem value="slider">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Slider
              </div>
            </SelectItem>
            <SelectItem value="add_yours">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Yours
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderForm()}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Add to Moment
        </Button>
      </div>
    </div>
  );

  return embedded ? (
    <div className="px-4 pb-4">{innerContent}</div>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Interactive Element</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {innerContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};
