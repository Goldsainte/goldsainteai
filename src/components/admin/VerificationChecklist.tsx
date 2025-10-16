import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface VerificationChecklistProps {
  items: ChecklistItem[];
  onItemChange: (id: string, checked: boolean) => void;
}

export const VerificationChecklist = ({ items, onItemChange }: VerificationChecklistProps) => {
  return (
    <div className="space-y-4 p-6 bg-card rounded-lg border">
      <h3 className="font-secondary text-lg font-semibold mb-4">Verification Checklist</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start space-x-3">
            <Checkbox
              id={item.id}
              checked={item.checked}
              onCheckedChange={(checked) => onItemChange(item.id, checked as boolean)}
            />
            <Label
              htmlFor={item.id}
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
