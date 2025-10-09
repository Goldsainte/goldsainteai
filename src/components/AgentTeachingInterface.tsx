import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Brain, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentTeachingInterfaceProps {
  agentName: string;
  onAgentNameChange: (name: string) => void;
  personality: string;
  onPersonalityChange: (personality: string) => void;
  communicationStyle: string;
  onCommunicationStyleChange: (style: string) => void;
  customKnowledge: string[];
  onCustomKnowledgeChange: (knowledge: string[]) => void;
}

export const AgentTeachingInterface = ({
  agentName,
  onAgentNameChange,
  personality,
  onPersonalityChange,
  communicationStyle,
  onCommunicationStyleChange,
  customKnowledge,
  onCustomKnowledgeChange,
}: AgentTeachingInterfaceProps) => {
  const [newKnowledge, setNewKnowledge] = useState("");

  const addKnowledge = () => {
    if (newKnowledge.trim()) {
      onCustomKnowledgeChange([...customKnowledge, newKnowledge.trim()]);
      setNewKnowledge("");
    }
  };

  const removeKnowledge = (index: number) => {
    onCustomKnowledgeChange(customKnowledge.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Teach Your AI Agent
        </Label>
        <p className="text-sm text-muted-foreground">
          Personalize how your agent thinks, communicates, and helps you plan trips.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            placeholder="e.g., My Travel Buddy, Alex the Explorer"
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Give your agent a friendly name</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="communication-style">Communication Style</Label>
          <Select value={communicationStyle} onValueChange={onCommunicationStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional & Detailed</SelectItem>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="concise">Brief & To the Point</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic & Excited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="personality">Personality & Instructions</Label>
          <Textarea
            id="personality"
            placeholder="Example: Always suggest eco-friendly options. I prefer boutique hotels over chains. Love trying local street food. Avoid crowds when possible. Budget-conscious but willing to splurge on unique experiences."
            value={personality}
            onChange={(e) => onPersonalityChange(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Describe your travel preferences, priorities, and any special requirements
          </p>
        </div>

        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Custom Knowledge Base
            </Label>
            <p className="text-xs text-muted-foreground">
              Add specific facts, preferences, or instructions for your agent
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="e.g., I have a peanut allergy, I'm vegetarian, I love jazz music..."
                value={newKnowledge}
                onChange={(e) => setNewKnowledge(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKnowledge()}
              />
              <Button onClick={addKnowledge} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customKnowledge.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {customKnowledge.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-3 pr-1 py-1 gap-1"
                  >
                    <span className="text-xs">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeKnowledge(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};