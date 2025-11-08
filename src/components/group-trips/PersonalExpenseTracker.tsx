import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PersonalExpenseTrackerProps {
  suggestions: any[];
  participants: any[];
  userId: string;
  budgetPerPerson?: number;
}

export const PersonalExpenseTracker = ({ 
  suggestions, 
  participants, 
  userId,
  budgetPerPerson 
}: PersonalExpenseTrackerProps) => {
  // Get user's participations
  const userParticipations = participants.filter(p => p.user_id === userId);
  
  // Calculate costs for suggestions user is participating in
  const interestedSuggestions = suggestions.filter(s => 
    s.price && userParticipations.some(p => p.suggestion_id === s.id && p.status === 'interested')
  );
  
  const confirmedSuggestions = suggestions.filter(s => 
    s.price && userParticipations.some(p => p.suggestion_id === s.id && p.status === 'confirmed')
  );

  const interestedTotal = interestedSuggestions.reduce((sum, s) => {
    const participantCount = participants.filter(
      p => p.suggestion_id === s.id && p.status !== 'declined'
    ).length;
    return sum + (participantCount > 0 ? s.price / participantCount : s.price);
  }, 0);

  const confirmedTotal = confirmedSuggestions.reduce((sum, s) => {
    const participantCount = participants.filter(
      p => p.suggestion_id === s.id && p.status !== 'declined'
    ).length;
    return sum + (participantCount > 0 ? s.price / participantCount : s.price);
  }, 0);

  const totalCost = interestedTotal + confirmedTotal;
  const budgetProgress = budgetPerPerson 
    ? Math.min((confirmedTotal / Number(budgetPerPerson)) * 100, 100)
    : 0;

  const categoryTotals = confirmedSuggestions.reduce((acc, s) => {
    const type = s.suggestion_type;
    const participantCount = participants.filter(
      p => p.suggestion_id === s.id && p.status !== 'declined'
    ).length;
    const splitCost = participantCount > 0 ? s.price / participantCount : s.price;
    acc[type] = (acc[type] || 0) + splitCost;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    hotel: 'Hotels',
    activity: 'Activities',
    restaurant: 'Restaurants',
    flight: 'Flights',
  };

  const categoryIcons: Record<string, string> = {
    hotel: '🏨',
    activity: '🎯',
    restaurant: '🍽️',
    flight: '✈️',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          My Trip Expenses
        </CardTitle>
        <CardDescription>
          Your personal cost breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confirmed Expenses */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Confirmed</span>
            </div>
            <span className="text-2xl font-bold">${confirmedTotal.toFixed(2)}</span>
          </div>
          
          {budgetPerPerson && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Your budget: ${Number(budgetPerPerson).toFixed(2)}</span>
                <span className={confirmedTotal > Number(budgetPerPerson) ? 'text-destructive' : 'text-green-600'}>
                  {confirmedTotal > Number(budgetPerPerson) ? '+' : ''}
                  ${(confirmedTotal - Number(budgetPerPerson)).toFixed(2)}
                </span>
              </div>
              <Progress value={budgetProgress} className="h-2" />
            </div>
          )}
        </div>

        <Separator />

        {/* Interested/Pending */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Considering</span>
            </div>
            <span className="text-lg font-semibold">${interestedTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Additional cost if you confirm all pending activities
          </p>
        </div>

        <Separator />

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Confirmed by Category</h4>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([type, total]) => {
                const totalAmount = Number(total);
                const percentage = confirmedTotal > 0 ? (totalAmount / confirmedTotal) * 100 : 0;
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{categoryIcons[type]}</span>
                        <span>{categoryLabels[type]}</span>
                      </span>
                      <span className="font-medium">${totalAmount.toFixed(2)}</span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Summary */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total if all confirmed</span>
            <span className="text-lg font-bold">${totalCost.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{confirmedSuggestions.length}</div>
              <div className="text-xs text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{interestedSuggestions.length}</div>
              <div className="text-xs text-muted-foreground">Considering</div>
            </div>
          </div>
        </div>

        {confirmedSuggestions.length === 0 && interestedSuggestions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No activities selected yet. Mark activities you're interested in to see your costs.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
