import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, GripVertical } from "lucide-react";

interface ArrayFieldEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ArrayFieldEditor({ items, onChange, placeholder }: ArrayFieldEditorProps) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 p-3 bg-[#FDF9F0] rounded-lg border border-[#E5DFC6] group"
            >
              <GripVertical className="h-4 w-4 text-[#6B7280] flex-shrink-0" />
              <span className="flex-1 text-sm text-[#0a2225]">{item}</span>
              <button
                onClick={() => removeItem(idx)}
                className="p-1 text-[#6B7280] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Add item"}
          className="flex-1 border-[#E5DFC6] focus:ring-[#C7A962]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="border-[#E5DFC6] text-[#0a2225]"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
