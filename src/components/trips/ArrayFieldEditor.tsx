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
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 p-4 bg-[#FDF9F0] rounded-xl border border-[#E5DFC6]/50 group hover:border-[#C7A962]/30 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-[#C7A962]/50 flex-shrink-0" />
              <span className="flex-1 text-sm text-[#0a2225]">{item}</span>
              <button
                onClick={() => removeItem(idx)}
                className="p-1.5 text-[#6B7280] hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className="flex gap-3">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Add item"}
          className="flex-1 rounded-xl h-10 sm:h-12 text-xs sm:text-sm border-[#E5DFC6] bg-white focus:ring-2 focus:ring-[#C7A962]/20 focus:border-[#C7A962] transition-all"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="rounded-full px-4 sm:px-5 h-10 sm:h-12 border-[#E5DFC6] text-[#0a2225] hover:bg-[#FDF9F0] hover:border-[#C7A962] disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}