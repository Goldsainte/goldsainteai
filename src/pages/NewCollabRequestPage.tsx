import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

// Mock creator data - in production, fetch from API
const MOCK_CREATORS: Record<string, any> = {
  "1": {
    name: "Sarah Chen",
    tiktokHandle: "@sarahgoesglobal",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    niche: ["Luxury Travel", "Fine Dining", "Hotels"],
  },
  "2": {
    name: "Marcus Adventure",
    tiktokHandle: "@marcusadventure",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    niche: ["Adventure", "Hiking", "Wildlife"],
  },
};

export default function NewCollabRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get("creatorId") || "";
  const creator = MOCK_CREATORS[creatorId];

  const [formData, setFormData] = useState({
    tripType: "",
    destination: "",
    budget: "",
    duration: "",
    groupSize: "",
    proposedDate: "",
    message: "",
    commissionOffered: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.tripType || !formData.destination || !formData.message) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // In production: send to API
    console.log("Collaboration request:", {
      creatorId,
      ...formData,
    });

    toast({
      title: "Request sent!",
      description: `Your collaboration proposal has been sent to ${creator?.name}`,
    });

    // Navigate back to marketplace
    setTimeout(() => {
      navigate("/browse-creators");
    }, 1500);
  };

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Creator not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/browse-creators")}
            >
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/browse-creators")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creators
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">New Collaboration Proposal</CardTitle>
            <div className="flex items-center gap-3 pt-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={creator.avatarUrl} />
                <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{creator.name}</p>
                <p className="text-sm text-muted-foreground">
                  {creator.tiktokHandle}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Type */}
              <div className="space-y-2">
                <Label htmlFor="tripType">
                  Trip Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tripType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tripType: value })
                  }
                >
                  <SelectTrigger id="tripType">
                    <SelectValue placeholder="Select trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="luxury">Luxury Experience</SelectItem>
                    <SelectItem value="adventure">Adventure Tour</SelectItem>
                    <SelectItem value="wellness">Wellness Retreat</SelectItem>
                    <SelectItem value="cultural">Cultural Immersion</SelectItem>
                    <SelectItem value="culinary">Culinary Journey</SelectItem>
                    <SelectItem value="family">Family Vacation</SelectItem>
                    <SelectItem value="custom">Custom Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">
                  Destination <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Bali, Indonesia"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                />
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget per Person (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 2500"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 7"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Group Size & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupSize">Target Group Size</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.groupSize}
                    onChange={(e) =>
                      setFormData({ ...formData, groupSize: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedDate">Proposed Start Date</Label>
                  <Input
                    id="proposedDate"
                    type="date"
                    value={formData.proposedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, proposedDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Commission */}
              <div className="space-y-2">
                <Label htmlFor="commissionOffered">
                  Commission Offered (%)
                </Label>
                <Input
                  id="commissionOffered"
                  type="number"
                  placeholder="e.g., 15"
                  value={formData.commissionOffered}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionOffered: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Typical creator commissions range from 10-20%
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Proposal Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell the creator about your vision for this collaboration. What makes this trip special? Why do you think they're a perfect fit?"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about what you're offering and what you're looking
                  for in return
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">What happens next?</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    • Your proposal will be sent directly to {creator.name}
                  </li>
                  <li>• They typically respond within 2-3 business days</li>
                  <li>
                    • You'll be notified via email and in-app when they respond
                  </li>
                  <li>
                    • If accepted, you'll collaborate on trip details and
                    pricing
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/browse-creators")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Proposal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
