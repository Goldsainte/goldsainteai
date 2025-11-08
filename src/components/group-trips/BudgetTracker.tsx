import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BudgetTrackerProps {
  suggestions: any[];
  members: any[];
  budgetPerPerson?: number;
}

export const BudgetTracker = ({ suggestions, members, budgetPerPerson }: BudgetTrackerProps) => {
  const acceptedMembersCount = members.filter(m => m.status === 'accepted').length;
  
  // Calculate approved suggestions (majority upvotes or 3+ upvotes)
  const approvedSuggestions = suggestions.filter(s => {
    const totalVotes = s.upvotes + s.downvotes;
    const majorityVotes = totalVotes > 0 && s.upvotes > s.downvotes;
    return s.price && (s.upvotes >= 3 || (majorityVotes && s.upvotes >= acceptedMembersCount / 2));
  });

  const allSuggestionsWithPrice = suggestions.filter(s => s.price);

  // Calculate totals
  const approvedTotal = approvedSuggestions.reduce((sum, s) => sum + (s.price || 0), 0);
  const allTotal = allSuggestionsWithPrice.reduce((sum, s) => sum + (s.price || 0), 0);
  
  const approvedPerPerson = acceptedMembersCount > 0 ? approvedTotal / acceptedMembersCount : 0;
  const allPerPerson = acceptedMembersCount > 0 ? allTotal / acceptedMembersCount : 0;

  // Calculate by category
  const categoryTotals = approvedSuggestions.reduce((acc, s) => {
    const type = s.suggestion_type;
    acc[type] = (acc[type] || 0) + s.price;
    return acc;
  }, {} as Record<string, number>);

  const budgetProgress = budgetPerPerson 
    ? Math.min((approvedPerPerson / budgetPerPerson) * 100, 100)
    : 0;

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
          Budget Tracker
        </CardTitle>
        <CardDescription>
          Track expenses and per-person costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Approved Budget Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved Items</span>
            </div>
            <span className="text-2xl font-bold">${approvedTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Per person
            </span>
            <span className="font-semibold">${approvedPerPerson.toFixed(2)}</span>
          </div>

          {budgetPerPerson && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Budget per person: ${Number(budgetPerPerson).toFixed(2)}</span>
                <span className={approvedPerPerson > Number(budgetPerPerson) ? 'text-destructive' : 'text-green-600'}>
                  {approvedPerPerson > Number(budgetPerPerson) ? '+' : ''}
                  ${(approvedPerPerson - Number(budgetPerPerson)).toFixed(2)}
                </span>
              </div>
              <Progress value={budgetProgress} className="h-2" />
            </div>
          )}
        </div>

        <Separator />

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Breakdown by Category</h4>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([type, total]) => {
                const totalAmount = Number(total);
                const perPerson = acceptedMembersCount > 0 ? totalAmount / acceptedMembersCount : 0;
                const percentage = approvedTotal > 0 ? (totalAmount / approvedTotal) * 100 : 0;
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{categoryIcons[type]}</span>
                        <span>{categoryLabels[type]}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${totalAmount.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          (${perPerson.toFixed(2)}/person)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* All Suggestions Total */}
        <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">All Suggestions Total</span>
            <span className="font-semibold">${allTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>If all approved</span>
            <span>${allPerPerson.toFixed(2)}/person</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">{approvedSuggestions.length}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold">{allSuggestionsWithPrice.length}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold">{acceptedMembersCount}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
        </div>

        {approvedSuggestions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No approved suggestions yet. Items with 3+ upvotes or majority approval will appear here.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
