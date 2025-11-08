import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface ExportTripButtonProps {
  trip: any;
  suggestions: any[];
  members: any[];
  participants: any[];
}

export const ExportTripButton = ({ trip, suggestions, members, participants }: ExportTripButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Helper to add text with word wrapping
      const addText = (text: string, x: number, fontSize: number = 12, isBold: boolean = false) => {
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, pageWidth - 40);
        doc.text(lines, x, yPosition);
        yPosition += (lines.length * fontSize * 0.4) + 5;
      };

      const checkPageBreak = (requiredSpace: number = 20) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Title
      addText(`${trip.title}`, 20, 20, true);
      addText(`Trip Itinerary`, 20, 16, false);
      yPosition += 5;

      // Trip Details
      addText('Trip Details', 20, 14, true);
      addText(`Destination: ${trip.destination}`, 20);
      addText(`Dates: ${format(new Date(trip.start_date), 'MMMM d, yyyy')} - ${format(new Date(trip.end_date), 'MMMM d, yyyy')}`, 20);
      
      const acceptedMembers = members.filter(m => m.status === 'accepted');
      addText(`Members: ${acceptedMembers.length}`, 20);
      
      if (trip.budget_per_person) {
        addText(`Budget per person: $${Number(trip.budget_per_person).toFixed(2)}`, 20);
      }
      
      if (trip.description) {
        yPosition += 5;
        addText(trip.description, 20);
      }

      yPosition += 10;
      checkPageBreak();

      // Confirmed Activities
      const confirmedSuggestions = suggestions.filter(s => {
        const totalVotes = s.upvotes + s.downvotes;
        const majorityVotes = totalVotes > 0 && s.upvotes > s.downvotes;
        return s.upvotes >= 3 || (majorityVotes && s.upvotes >= acceptedMembers.length / 2);
      });

      if (confirmedSuggestions.length > 0) {
        addText('Confirmed Activities', 20, 14, true);
        
        // Group by type
        const grouped = confirmedSuggestions.reduce((acc, s) => {
          if (!acc[s.suggestion_type]) acc[s.suggestion_type] = [];
          acc[s.suggestion_type].push(s);
          return acc;
        }, {} as Record<string, any[]>);

        const categoryLabels: Record<string, string> = {
          hotel: 'Hotels',
          activity: 'Activities',
          restaurant: 'Restaurants',
          flight: 'Flights',
        };

        Object.entries(grouped).forEach(([type, items]: [string, any[]]) => {
          checkPageBreak(30);
          yPosition += 5;
          addText(categoryLabels[type] || type, 25, 12, true);

          items.forEach((suggestion) => {
            checkPageBreak(40);
            
            // Title
            addText(`• ${suggestion.title}`, 30, 11, true);
            
            // Description
            if (suggestion.description) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
              const descLines = doc.splitTextToSize(suggestion.description, pageWidth - 70);
              doc.text(descLines, 35, yPosition);
              yPosition += (descLines.length * 4) + 3;
            }

            // Location
            if (suggestion.location) {
              addText(`Location: ${suggestion.location}`, 35, 10);
            }

            // Price and participants
            if (suggestion.price) {
              const suggestionParticipants = participants.filter(
                p => p.suggestion_id === suggestion.id && p.status !== 'declined'
              );
              const participantCount = suggestionParticipants.length;
              const splitCost = participantCount > 0 ? suggestion.price / participantCount : suggestion.price;
              
              addText(
                `Cost: $${suggestion.price.toFixed(2)} total${participantCount > 0 ? ` ($${splitCost.toFixed(2)}/person, ${participantCount} participants)` : ''}`,
                35,
                10
              );
            }

            // Votes
            addText(`Votes: ${suggestion.upvotes} 👍 ${suggestion.downvotes} 👎`, 35, 10);
            
            yPosition += 5;
          });
        });
      }

      // Budget Summary
      checkPageBreak(50);
      yPosition += 10;
      addText('Budget Summary', 20, 14, true);

      const confirmedTotal = confirmedSuggestions.reduce((sum, s) => sum + (s.price || 0), 0);
      const perPersonCost = acceptedMembers.length > 0 ? confirmedTotal / acceptedMembers.length : 0;

      addText(`Total Cost: $${confirmedTotal.toFixed(2)}`, 25);
      addText(`Cost per Person: $${perPersonCost.toFixed(2)}`, 25);

      if (trip.budget_per_person) {
        const budgetDiff = perPersonCost - Number(trip.budget_per_person);
        const status = budgetDiff > 0 ? 'Over' : 'Under';
        addText(
          `Budget Status: ${status} by $${Math.abs(budgetDiff).toFixed(2)}`,
          25
        );
      }

      // Category breakdown
      const categoryTotals = confirmedSuggestions.reduce((acc, s) => {
        const type = s.suggestion_type;
        acc[type] = (acc[type] || 0) + (s.price || 0);
        return acc;
      }, {} as Record<string, number>);

      if (Object.keys(categoryTotals).length > 0) {
        yPosition += 5;
        addText('Breakdown by Category:', 25, 11, true);
        
        const categoryLabels: Record<string, string> = {
          hotel: 'Hotels',
          activity: 'Activities',
          restaurant: 'Restaurants',
          flight: 'Flights',
        };

        Object.entries(categoryTotals).forEach(([type, total]) => {
          checkPageBreak();
          const totalAmount = Number(total);
          const perPerson = acceptedMembers.length > 0 ? totalAmount / acceptedMembers.length : 0;
          addText(
            `${categoryLabels[type]}: $${totalAmount.toFixed(2)} ($${perPerson.toFixed(2)}/person)`,
            30,
            10
          );
        });
      }

      // Members List
      checkPageBreak(40);
      yPosition += 10;
      addText('Trip Members', 20, 14, true);
      
      acceptedMembers.forEach((member) => {
        checkPageBreak();
        addText(`• ${member.email || 'Member'}`, 25, 10);
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128);
      const footerText = `Generated on ${format(new Date(), 'MMMM d, yyyy')}`;
      doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

      // Save PDF
      doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}_itinerary.pdf`);

      toast({
        title: 'Success',
        description: 'Trip itinerary exported successfully',
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export trip itinerary',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={exportToPDF} disabled={exporting} variant="outline">
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  );
};
